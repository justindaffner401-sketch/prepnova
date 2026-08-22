-- CampVoice — initial schema
-- ---------------------------------------------------------------------------
-- Everything a camp owns hangs off `organizations`. Every table that stores
-- camp data carries `organization_id` and is protected by Row Level Security
-- so one camp can never read another camp's rows, no matter what the browser
-- asks for.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Helper: the timestamp trigger used by most tables.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per Supabase auth user.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatically create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Organizations: one camp.
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  logo_path text,
  location text,
  camp_type text,
  age_range text,
  description text,
  onboarding_step smallint not null default 1,
  onboarding_completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Membership: which users belong to which camp. Built for multiple team
-- members later, without a complicated permission system today.
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'member');

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members(user_id);
create index organization_members_org_idx on public.organization_members(organization_id);

-- Security-definer helper so RLS policies can check membership without
-- recursing back into a policy-protected table.
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Camp profile detail: the free-form knowledge collected during onboarding.
-- One row per organization.
-- ---------------------------------------------------------------------------
create table public.camp_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  programs text,
  traditions text,
  audience text,
  voice_traits text[] not null default '{}',
  avoid_list text[] not null default '{}',
  communication_notes text,
  pasted_examples text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger camp_profiles_set_updated_at
  before update on public.camp_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Terminology: "we call cabins bunks".
-- ---------------------------------------------------------------------------
create table public.camp_terminology (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  standard_term text not null,
  camp_term text not null,
  note text,
  created_at timestamptz not null default now()
);

create index camp_terminology_org_idx on public.camp_terminology(organization_id);

-- ---------------------------------------------------------------------------
-- Camp DNA: the generated, editable understanding of the camp.
-- ---------------------------------------------------------------------------
create table public.camp_dna (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  voice_summary text,
  terminology_summary text,
  core_themes text[] not null default '{}',
  style_notes text,
  audience_notes text,
  avoid_notes text,
  /* True once a human has edited the DNA, so a rebuild never silently
     overwrites their wording without asking. */
  edited_by_user boolean not null default false,
  source_fingerprint text,
  built_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger camp_dna_set_updated_at
  before update on public.camp_dna
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Important dates.
-- ---------------------------------------------------------------------------
create table public.camp_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  event_type text not null default 'custom',
  starts_on date not null,
  ends_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index camp_events_org_date_idx on public.camp_events(organization_id, starts_on);

create trigger camp_events_set_updated_at
  before update on public.camp_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Source documents: uploaded files, pasted text, imported website pages.
-- `extracted_text` is REFERENCE DATA ONLY and is never treated as an
-- instruction to the AI (see src/lib/ai/guardrails.ts).
-- ---------------------------------------------------------------------------
create type public.source_kind as enum ('upload', 'paste', 'website');
create type public.source_status as enum ('pending', 'ready', 'failed');

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind public.source_kind not null,
  title text not null,
  storage_path text,
  source_url text,
  mime_type text,
  byte_size integer,
  extracted_text text,
  char_count integer not null default 0,
  status public.source_status not null default 'pending',
  error_message text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index source_documents_org_idx on public.source_documents(organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Content generations: every draft CampVoice writes.
-- ---------------------------------------------------------------------------
create type public.content_status as enum ('draft', 'saved', 'archived');

create table public.content_generations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  template_id text not null,
  category text not null,
  title text not null,
  /* The structured answers the user typed into the form. Never a raw prompt. */
  inputs jsonb not null default '{}'::jsonb,
  output text not null,
  /* The user's edited version, when they have changed it. */
  edited_output text,
  status public.content_status not null default 'draft',
  is_favorite boolean not null default false,
  model text,
  revision_count integer not null default 0,
  parent_id uuid references public.content_generations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_generations_org_idx on public.content_generations(organization_id, created_at desc);
create index content_generations_org_fav_idx on public.content_generations(organization_id, is_favorite);
create index content_generations_org_cat_idx on public.content_generations(organization_id, category);

create trigger content_generations_set_updated_at
  before update on public.content_generations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Subscriptions: Stripe is the source of truth; the webhook writes here.
-- ---------------------------------------------------------------------------
create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', 'none'
);

create table public.subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status public.subscription_status not null default 'none',
  price_id text,
  plan_interval text,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_customer_idx on public.subscriptions(stripe_customer_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- AI usage: internal cost + fair-use tracking.
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  operation text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(10, 6) not null default 0,
  succeeded boolean not null default true,
  error_code text,
  created_at timestamptz not null default now()
);

create index ai_usage_org_time_idx on public.ai_usage(organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Analytics events: privacy-conscious product analytics, no PII payloads.
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id bigserial primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  event text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_time_idx on public.analytics_events(created_at desc);
create index analytics_events_event_idx on public.analytics_events(event);

-- ---------------------------------------------------------------------------
-- Support messages from the public contact form.
-- ---------------------------------------------------------------------------
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  camp_name text,
  message text not null,
  created_at timestamptz not null default now()
);
