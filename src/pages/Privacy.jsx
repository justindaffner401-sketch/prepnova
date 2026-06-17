import { useEffect } from "react";
import { Link } from "react-router-dom";

// Plain-English privacy policy. Content reflects what the app ACTUALLY does
// today (see /docs/data-compliance.md). [BRACKETED] items are placeholders the
// site owner must fill in. This is NOT legal advice — see the disclaimer below.
export default function Privacy() {
  useEffect(() => {
    document.title = "PrepNova — Privacy Policy";
  }, []);

  return (
    <main className="container-pn max-w-3xl pt-28 pb-20 sm:pt-36">
      <h1 className="font-display text-4xl font-extrabold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">
        Effective date: <strong>[EFFECTIVE DATE]</strong> · Last updated: <strong>[LAST UPDATED DATE]</strong>
      </p>

      <div className="prose-pn mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
        <p>
          This Privacy Policy explains how <strong>[COMPANY / OPERATOR LEGAL NAME]</strong> ("we,"
          "us") collects, uses, and protects information when you use PrepNova at prepnovaai.com (the
          "Service"). Questions? Contact <strong>[CONTACT EMAIL]</strong>.
        </p>

        <h2 className="font-display text-xl font-bold text-white">Information we collect</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Account data:</strong> your email address and a password (stored hashed by our auth provider — we never see your raw password).</li>
          <li><strong>Subscription/billing status:</strong> your plan status and the identifiers our payment processor assigns (e.g. customer/subscription IDs). We do <strong>not</strong> store your card number.</li>
          <li><strong>Practice activity:</strong> your scores and progress are stored <strong>locally in your browser</strong> (localStorage) on this device — they are not uploaded to our servers.</li>
          <li><strong>AI generation requests:</strong> when you generate questions we send the test/subject you chose to our server and on to our AI providers to create and double-check questions.</li>
          <li><strong>Analytics:</strong> privacy-friendly, cookieless usage analytics (page views, performance), loaded only if you accept cookies.</li>
          <li><strong>Essential storage:</strong> a small amount of browser storage to keep you signed in and remember your cookie choice.</li>
        </ul>

        <h2 className="font-display text-xl font-bold text-white">How we use information</h2>
        <p>To provide and secure the Service: sign you in, generate and verify practice questions, process subscriptions, provide support, prevent abuse, and improve the product. We do not sell your personal information.</p>

        <h2 className="font-display text-xl font-bold text-white">Service providers we share data with</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Supabase</strong> — authentication and database (account + subscription records).</li>
          <li><strong>Stripe</strong> — payment processing (card data is handled by Stripe, not us).</li>
          <li><strong>Vercel</strong> — hosting and privacy-friendly analytics.</li>
          <li><strong>Anthropic</strong> and <strong>OpenAI</strong> — generating and verifying practice questions.</li>
          <li><strong>Resend</strong> — sending account emails (e.g. confirmation, password reset).</li>
        </ul>
        <p>Each provider processes data under its own terms and privacy policy.</p>

        <h2 className="font-display text-xl font-bold text-white">Cookies &amp; local storage</h2>
        <p>
          Essential storage keeps you signed in and remembers your cookie choice. Optional analytics
          is cookieless and only loads after you accept. You can change your choice anytime via
          "Cookie settings" in the footer.
        </p>

        <h2 className="font-display text-xl font-bold text-white">Data retention</h2>
        <p>We keep account and subscription records while your account is active and as needed for legal, tax, and accounting purposes. Browser-stored practice data stays until you clear it. <strong>[CONFIRM RETENTION PERIODS]</strong></p>

        <h2 className="font-display text-xl font-bold text-white">Your rights &amp; data deletion</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by emailing{" "}
          <strong>[CONTACT EMAIL]</strong>. To delete browser-stored practice data, clear your
          browser storage for this site. Depending on where you live, you may have additional rights
          under applicable law. <strong>[CONFIRM APPLICABLE RIGHTS / PROCESS]</strong>
        </p>

        <h2 className="font-display text-xl font-bold text-white">Security</h2>
        <p>We use HTTPS, hashed passwords, server-side secret keys, and database row-level security. No method of transmission or storage is 100% secure, but we work to protect your information.</p>

        <h2 className="font-display text-xl font-bold text-white">Students &amp; minors</h2>
        <p>
          PrepNova is test-prep for the ACT &amp; SAT and may be used by people under 18. We do not
          knowingly collect more data than described above. If you are a parent/guardian with
          questions or requests, contact <strong>[CONTACT EMAIL]</strong>. Laws such as COPPA, FERPA,
          GDPR, and U.S. state privacy laws may apply depending on your users and location —{" "}
          <strong>we have not certified compliance with any specific framework here, and legal review
          is recommended before relying on this section.</strong>
        </p>

        <h2 className="font-display text-xl font-bold text-white">Changes</h2>
        <p>We may update this policy; we'll revise the "Last updated" date above. Material changes will be reflected here.</p>

        <p className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4 text-amber-200/90">
          <strong>Disclaimer:</strong> this template is provided for convenience and is{" "}
          <strong>not legal advice</strong>. Have it reviewed by a qualified attorney before
          publishing — especially regarding minors/student data. <strong>[LEGAL REVIEW STATUS]</strong>
        </p>

        <p className="text-slate-400">
          See also our <Link to="/terms" className="text-electric-300 underline underline-offset-2">Terms of Service</Link>.
        </p>
      </div>
    </main>
  );
}
