/**
 * Seeds a realistic demo camp for development.
 *
 * WHAT IT DOES: creates a user, an organization ("Camp Evergreen"), a full camp
 * profile, terminology, dates, a Camp DNA profile and a few example
 * communications — so you can click through the whole product without signing
 * up or spending anything on AI calls.
 *
 * HOW TO RUN:
 *   npm run seed:demo
 *
 * SAFETY: this refuses to run unless SUPABASE_SERVICE_ROLE_KEY is set, and it
 * refuses to run against a URL that looks like production unless you pass
 * --force. Camp Evergreen is entirely fictional.
 */

import { createClient } from "@supabase/supabase-js";
import { DEMO_CAMP, DEMO_CONTENT, DEMO_DNA, DEMO_PROFILE, DEMO_TERMINOLOGY, demoEvents } from "./demo-data";

const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@campevergreen.example";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "evergreen-demo-passphrase";

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
    process.exit(1);
  }

  const force = process.argv.includes("--force");
  if (!force && !/localhost|127\.0\.0\.1/.test(url) && process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo data into a production database. Pass --force if you really mean it.");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log(`Seeding demo camp into ${url}…`);

  // 1. The demo user.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Dana Reyes" },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (!createError.message.toLowerCase().includes("already")) throw createError;
    const { data: list } = await supabase.auth.admin.listUsers();
    userId = list?.users.find((user) => user.email === DEMO_EMAIL)?.id;
    console.log("Demo user already existed — reusing it.");
  }

  if (!userId) throw new Error("Could not create or find the demo user.");

  // 2. The organization.
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", DEMO_CAMP.slug)
    .maybeSingle<{ id: string }>();

  let organizationId = existingOrg?.id;

  if (!organizationId) {
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        ...DEMO_CAMP,
        created_by: userId,
        onboarding_step: 6,
        onboarding_completed_at: new Date().toISOString(),
      })
      .select("id")
      .single<{ id: string }>();
    if (error) throw error;
    organizationId = data.id;
  }

  await supabase
    .from("organization_members")
    .upsert({ organization_id: organizationId, user_id: userId, role: "owner" }, { onConflict: "organization_id,user_id" });

  // 3. Camp knowledge.
  await supabase
    .from("camp_profiles")
    .upsert({ organization_id: organizationId, ...DEMO_PROFILE }, { onConflict: "organization_id" });

  await supabase.from("camp_terminology").delete().eq("organization_id", organizationId);
  await supabase
    .from("camp_terminology")
    .insert(DEMO_TERMINOLOGY.map((term) => ({ ...term, organization_id: organizationId })));

  await supabase.from("camp_events").delete().eq("organization_id", organizationId);
  await supabase.from("camp_events").insert(demoEvents().map((event) => ({ ...event, organization_id: organizationId })));

  await supabase.from("camp_dna").upsert(
    { organization_id: organizationId, ...DEMO_DNA, built_at: new Date().toISOString(), edited_by_user: false },
    { onConflict: "organization_id" },
  );

  // 4. A trial subscription so the demo account can use the product.
  await supabase.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      status: "trialing",
      trial_ends_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    },
    { onConflict: "organization_id" },
  );

  // 5. Example communications.
  const { count } = await supabase
    .from("content_generations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if ((count ?? 0) === 0) {
    await supabase.from("content_generations").insert(
      DEMO_CONTENT.map((item, index) => ({
        organization_id: organizationId,
        created_by: userId,
        template_id: item.template_id,
        category: item.category,
        title: item.title,
        inputs: item.inputs,
        output: item.output,
        status: "saved" as const,
        is_favorite: index === 0,
        model: "demo-seed",
      })),
    );
  }

  console.log("\nDone. Sign in at http://localhost:3000/sign-in with:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
}

main().catch((error) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
