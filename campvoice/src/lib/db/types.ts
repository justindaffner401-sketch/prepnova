/**
 * Hand-written database types.
 *
 * These mirror supabase/migrations/*.sql. If you change a migration, change the
 * matching type here — `npm run typecheck` will then point at every place in the
 * app that needs updating.
 */

export type MemberRole = "owner" | "member";
export type SourceKind = "upload" | "paste" | "website";
export type SourceStatus = "pending" | "ready" | "failed";
export type ContentStatus = "draft" | "saved" | "archived";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "none";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logo_path: string | null;
  location: string | null;
  camp_type: string | null;
  age_range: string | null;
  description: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface CampProfile {
  organization_id: string;
  programs: string | null;
  traditions: string | null;
  audience: string | null;
  voice_traits: string[];
  avoid_list: string[];
  communication_notes: string | null;
  pasted_examples: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampTerminology {
  id: string;
  organization_id: string;
  standard_term: string;
  camp_term: string;
  note: string | null;
  created_at: string;
}

export interface CampDna {
  organization_id: string;
  voice_summary: string | null;
  terminology_summary: string | null;
  core_themes: string[];
  style_notes: string | null;
  audience_notes: string | null;
  avoid_notes: string | null;
  edited_by_user: boolean;
  source_fingerprint: string | null;
  built_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampEvent {
  id: string;
  organization_id: string;
  title: string;
  event_type: string;
  starts_on: string;
  ends_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceDocument {
  id: string;
  organization_id: string;
  kind: SourceKind;
  title: string;
  storage_path: string | null;
  source_url: string | null;
  mime_type: string | null;
  byte_size: number | null;
  extracted_text: string | null;
  char_count: number;
  status: SourceStatus;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ContentGeneration {
  id: string;
  organization_id: string;
  created_by: string | null;
  template_id: string;
  category: string;
  title: string;
  inputs: Record<string, unknown>;
  output: string;
  edited_output: string | null;
  status: ContentStatus;
  is_favorite: boolean;
  model: string | null;
  revision_count: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  price_id: string | null;
  plan_interval: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiUsage {
  id: string;
  organization_id: string;
  user_id: string | null;
  operation: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  succeeded: boolean;
  error_code: string | null;
  created_at: string;
}
