-- CampVoice — Row Level Security
-- ---------------------------------------------------------------------------
-- THIS FILE IS THE SECURITY BOUNDARY BETWEEN CAMPS.
--
-- Rule: a signed-in user may only touch rows belonging to an organization they
-- are a member of. Membership is checked with public.is_org_member(), which is
-- a SECURITY DEFINER function so the check itself is not subject to RLS.
--
-- The Stripe webhook and other trusted server code use the service-role key,
-- which bypasses RLS by design. Nothing in the browser ever holds that key.
-- ---------------------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.organizations         enable row level security;
alter table public.organization_members  enable row level security;
alter table public.camp_profiles         enable row level security;
alter table public.camp_terminology      enable row level security;
alter table public.camp_dna              enable row level security;
alter table public.camp_events           enable row level security;
alter table public.source_documents      enable row level security;
alter table public.content_generations   enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.ai_usage              enable row level security;
alter table public.analytics_events      enable row level security;
alter table public.support_messages      enable row level security;

-- Also force RLS for table owners, so a mistake elsewhere cannot leak rows.
alter table public.organizations         force row level security;
alter table public.organization_members  force row level security;
alter table public.camp_profiles         force row level security;
alter table public.camp_terminology      force row level security;
alter table public.camp_dna              force row level security;
alter table public.camp_events           force row level security;
alter table public.source_documents      force row level security;
alter table public.content_generations   force row level security;

-- --------------------------- profiles --------------------------------------
create policy "read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_platform_admin());

create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

-- ------------------------- organizations -----------------------------------
create policy "read own organizations"
  on public.organizations for select
  using (public.is_org_member(id) or public.is_platform_admin());

create policy "create organization"
  on public.organizations for insert
  with check (created_by = auth.uid());

create policy "update own organization"
  on public.organizations for update
  using (public.is_org_member(id))
  with check (public.is_org_member(id));

-- --------------------- organization_members --------------------------------
create policy "read own memberships"
  on public.organization_members for select
  using (user_id = auth.uid() or public.is_org_member(organization_id) or public.is_platform_admin());

-- A user may only add THEMSELVES, and only to an org they created. Inviting
-- teammates is a future feature and will run through trusted server code.
create policy "join own organization"
  on public.organization_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.created_by = auth.uid()
    )
  );

-- ------------- per-organization tables: one policy set each ----------------
-- camp_profiles
create policy "org read camp_profiles"   on public.camp_profiles      for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "org write camp_profiles"  on public.camp_profiles      for insert with check (public.is_org_member(organization_id));
create policy "org update camp_profiles" on public.camp_profiles      for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

-- camp_terminology
create policy "org read camp_terminology"   on public.camp_terminology for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "org write camp_terminology"  on public.camp_terminology for insert with check (public.is_org_member(organization_id));
create policy "org update camp_terminology" on public.camp_terminology for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "org delete camp_terminology" on public.camp_terminology for delete using (public.is_org_member(organization_id));

-- camp_dna
create policy "org read camp_dna"   on public.camp_dna for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "org write camp_dna"  on public.camp_dna for insert with check (public.is_org_member(organization_id));
create policy "org update camp_dna" on public.camp_dna for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

-- camp_events
create policy "org read camp_events"   on public.camp_events for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "org write camp_events"  on public.camp_events for insert with check (public.is_org_member(organization_id));
create policy "org update camp_events" on public.camp_events for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "org delete camp_events" on public.camp_events for delete using (public.is_org_member(organization_id));

-- source_documents
create policy "org read source_documents"   on public.source_documents for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "org write source_documents"  on public.source_documents for insert with check (public.is_org_member(organization_id));
create policy "org update source_documents" on public.source_documents for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "org delete source_documents" on public.source_documents for delete using (public.is_org_member(organization_id));

-- content_generations
create policy "org read content"   on public.content_generations for select using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "org write content"  on public.content_generations for insert with check (public.is_org_member(organization_id));
create policy "org update content" on public.content_generations for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "org delete content" on public.content_generations for delete using (public.is_org_member(organization_id));

-- ------------------------- read-only tables --------------------------------
-- Billing state is written ONLY by the Stripe webhook (service role). Members
-- may read their own camp's status so the UI can show it.
create policy "org read subscriptions"
  on public.subscriptions for select
  using (public.is_org_member(organization_id) or public.is_platform_admin());

-- AI usage is written by trusted server code only.
create policy "org read ai_usage"
  on public.ai_usage for select
  using (public.is_org_member(organization_id) or public.is_platform_admin());

-- Analytics: admins read, nobody writes from the browser.
create policy "admin read analytics"
  on public.analytics_events for select
  using (public.is_platform_admin());

-- Support messages: admin read only; the public form inserts via server code.
create policy "admin read support"
  on public.support_messages for select
  using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Storage: uploaded camp materials.
-- Files live at <organization_id>/<filename>, so the first path segment is the
-- access-control key.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'camp-materials',
  'camp-materials',
  false,
  8388608,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do nothing;

create policy "org read camp materials"
  on storage.objects for select
  using (
    bucket_id = 'camp-materials'
    and public.is_org_member(nullif(split_part(name, '/', 1), '')::uuid)
  );

create policy "org upload camp materials"
  on storage.objects for insert
  with check (
    bucket_id = 'camp-materials'
    and public.is_org_member(nullif(split_part(name, '/', 1), '')::uuid)
  );

create policy "org delete camp materials"
  on storage.objects for delete
  using (
    bucket_id = 'camp-materials'
    and public.is_org_member(nullif(split_part(name, '/', 1), '')::uuid)
  );
