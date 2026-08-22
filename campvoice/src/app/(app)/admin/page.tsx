import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The reporting window for cost and usage figures. */
const REPORT_DAYS = 30;

function reportWindowStart(): string {
  return new Date(Date.now() - REPORT_DAYS * 86_400_000).toISOString();
}

/**
 * Internal admin.
 *
 * Deliberately read-only and deliberately small. It shows how the business is
 * doing and whether anything is broken. It never shows a customer's password
 * (we could not if we wanted to — we only ever see hashes) and never shows the
 * content a camp has written.
 */

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  onboarding_completed_at: string | null;
}

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [orgs, subs, usage, generations, errors, userCount] = await Promise.all([
    admin.from("organizations").select("id, name, slug, created_at, onboarding_completed_at").order("created_at", { ascending: false }).limit(50),
    admin.from("subscriptions").select("organization_id, status, plan_interval, trial_ends_at, current_period_end"),
    admin.from("ai_usage").select("organization_id, estimated_cost_usd, succeeded, created_at").gte("created_at", reportWindowStart()),
    admin.from("content_generations").select("organization_id"),
    admin.from("ai_usage").select("operation, error_code, created_at").eq("succeeded", false).order("created_at", { ascending: false }).limit(15),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const organizations = (orgs.data ?? []) as OrgRow[];
  const subscriptions = new Map((subs.data ?? []).map((row) => [row.organization_id, row]));

  const generationCounts = new Map<string, number>();
  for (const row of generations.data ?? []) {
    generationCounts.set(row.organization_id, (generationCounts.get(row.organization_id) ?? 0) + 1);
  }

  const costByOrg = new Map<string, number>();
  let totalCost = 0;
  let failedCalls = 0;
  for (const row of usage.data ?? []) {
    const cost = Number(row.estimated_cost_usd ?? 0);
    costByOrg.set(row.organization_id, (costByOrg.get(row.organization_id) ?? 0) + cost);
    totalCost += cost;
    if (!row.succeeded) failedCalls += 1;
  }

  const statusCounts = new Map<string, number>();
  for (const row of subscriptions.values()) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }

  const paying = (statusCounts.get("active") ?? 0) + (statusCounts.get("past_due") ?? 0);
  const trialing = statusCounts.get("trialing") ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold">Admin</h1>
      <p className="mt-2 prose-camp">Internal view. Read-only.</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Camps" value={organizations.length} />
        <Stat label="Users" value={userCount.count ?? 0} />
        <Stat label="Trialing" value={trialing} />
        <Stat label="Paying" value={paying} />
        <Stat label={`AI cost, ${REPORT_DAYS}d`} value={`$${totalCost.toFixed(2)}`} />
      </dl>

      {failedCalls > 0 ? (
        <p className="mt-4 text-sm text-ember-700">
          {failedCalls} failed AI {failedCalls === 1 ? "call" : "calls"} in the last {REPORT_DAYS} days.
        </p>
      ) : null}

      <section className="mt-10" aria-labelledby="orgs-heading">
        <h2 id="orgs-heading" className="font-display text-xl font-semibold">Organizations</h2>
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-paper-300 text-xs uppercase tracking-wide text-ink-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Camp</th>
                <th scope="col" className="px-4 py-3 font-semibold">Signed up</th>
                <th scope="col" className="px-4 py-3 font-semibold">Onboarding</th>
                <th scope="col" className="px-4 py-3 font-semibold">Subscription</th>
                <th scope="col" className="px-4 py-3 font-semibold">Generations</th>
                <th scope="col" className="px-4 py-3 font-semibold">AI cost {REPORT_DAYS}d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-300">
              {organizations.map((org) => {
                const subscription = subscriptions.get(org.id);
                return (
                  <tr key={org.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{org.name}</p>
                      <p className="text-xs text-ink-300">{org.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {new Date(org.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3">
                      {org.onboarding_completed_at ? (
                        <Badge tone="forest">Complete</Badge>
                      ) : (
                        <Badge tone="neutral">In progress</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={subscription?.status === "active" ? "forest" : subscription?.status === "trialing" ? "ember" : "neutral"}>
                        {subscription?.status ?? "none"}
                      </Badge>
                      {subscription?.plan_interval ? (
                        <span className="ml-1.5 text-xs text-ink-300">{subscription.plan_interval}ly</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{generationCounts.get(org.id) ?? 0}</td>
                    <td className="px-4 py-3 text-ink-700">${(costByOrg.get(org.id) ?? 0).toFixed(2)}</td>
                  </tr>
                );
              })}
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-300">No camps yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="errors-heading">
        <h2 id="errors-heading" className="font-display text-xl font-semibold">Recent AI failures</h2>
        {(errors.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-ink-300">No failed AI calls recorded.</p>
        ) : (
          <Card className="mt-4 divide-y divide-paper-300">
            {(errors.data ?? []).map((row, index) => (
              <div key={index} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="font-medium text-ink-900">{row.operation}</span>
                <span className="text-danger-600">{row.error_code ?? "unknown"}</span>
                <span className="text-ink-300">{new Date(row.created_at).toLocaleString()}</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</dd>
    </Card>
  );
}
