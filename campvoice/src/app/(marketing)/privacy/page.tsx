import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CampVoice handles the information camps provide.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="[DATE]">
      <LegalSection heading="Who we are">
        <p>
          CampVoice is operated by [LEGAL ENTITY NAME], [ENTITY TYPE] registered in [JURISDICTION], at [BUSINESS
          ADDRESS]. You can reach us at <a className="text-forest-700 underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>
          <strong>Account information.</strong> Your name, email address and password (stored only as a secure hash by
          our authentication provider).
        </p>
        <p>
          <strong>Camp information.</strong> Everything you choose to teach CampVoice: your camp profile, programs,
          traditions, terminology, tone preferences, important dates, uploaded documents, pasted examples and imported
          website text.
        </p>
        <p>
          <strong>Content you generate.</strong> The drafts CampVoice produces and the form answers you provided to
          create them.
        </p>
        <p>
          <strong>Billing information.</strong> Handled by Stripe. We store your subscription status and Stripe
          identifiers. We never see or store your card number.
        </p>
        <p>
          <strong>Product analytics.</strong> Which features are used and when, recorded without the content of your
          communications.
        </p>
      </LegalSection>

      <LegalSection heading="What we deliberately do not collect">
        <p>
          CampVoice is built so it does not need a camper database. We do not ask for and you should not enter camper
          medical or health information, camper account records, behavioural records, or any other sensitive information
          about a child. A first name typed into a one-off communication is stored with that draft; nothing in CampVoice
          builds a profile of a child.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          We use your information to run CampVoice: to build your Camp DNA, to generate the drafts you request, to keep
          your content history, to handle billing, and to support you.
        </p>
      </LegalSection>

      <LegalSection heading="Who we share it with">
        <p>
          <strong>Anthropic</strong> processes the camp context and your form answers in order to generate content.
          Anthropic&rsquo;s commercial terms state that they do not use inputs or outputs submitted through their API to
          train their models. Their terms are the authority on this and may change; please review them before uploading
          anything you consider sensitive.
        </p>
        <p><strong>Supabase</strong> hosts our database, authentication and file storage.</p>
        <p><strong>Stripe</strong> processes payments.</p>
        <p><strong>Vercel</strong> hosts the application.</p>
        <p>We do not sell your information, and we do not share it for advertising.</p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          We keep your camp information and content history for as long as your account is active. You can delete
          individual items at any time, and you can request deletion of your whole account from Settings → Data. After
          deletion we remove your data from our live systems within [NUMBER] days; backups roll off within [NUMBER] days.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can view, edit, export or delete your camp information from inside the app. Depending on where you live you
          may have additional rights, including access, correction, deletion and portability. Contact us and we will
          respond within [NUMBER] days. [ADD ANY GDPR / CCPA / STATE-LAW SPECIFIC RIGHTS AND CONTACT PROCESS REQUIRED BY
          COUNSEL.]
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          CampVoice is a business tool for camp staff. It is not directed at children and children should not use it.
          [CONFIRM WITH COUNSEL WHETHER COPPA, FERPA, STATE STUDENT-PRIVACY LAW OR ANY CAMP-SPECIFIC OBLIGATION APPLIES
          GIVEN THAT CAMP STAFF MAY TYPE A CHILD&rsquo;S FIRST NAME INTO A DRAFT.]
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Data is encrypted in transit. Each camp&rsquo;s data is isolated at the database level so one camp cannot read
          another&rsquo;s. Uploaded files are stored in a private bucket that is not publicly readable. No system is
          perfectly secure, and we do not claim compliance with any certification or framework.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>We will post any change here and update the date at the top. Material changes will be emailed to account holders.</p>
      </LegalSection>
    </LegalPage>
  );
}
