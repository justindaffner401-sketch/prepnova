import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { brand, pricing, trial } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern use of CampVoice.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="[DATE]">
      <LegalSection heading="Agreement">
        <p>
          These terms are between you (the camp organisation using CampVoice) and [LEGAL ENTITY NAME] (&ldquo;we&rdquo;).
          By creating an account you agree to them. If you are agreeing on behalf of a camp, you confirm you are
          authorised to do so.
        </p>
      </LegalSection>

      <LegalSection heading="What CampVoice does">
        <p>
          CampVoice generates draft communications based on information you provide. It does not send email, post to
          social media, or communicate with families on your behalf. You decide what to use and where to send it.
        </p>
      </LegalSection>

      <LegalSection heading="You are responsible for what you send">
        <p>
          Drafts are a starting point. AI-generated text can contain mistakes. You must review every draft before you use
          it, and you are solely responsible for the accuracy and appropriateness of anything you send to families,
          staff, alumni or the public.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          You keep ownership of the camp materials you upload and of the drafts CampVoice produces for you. You grant us
          the limited permission needed to store that material and to send it to our AI provider in order to produce your
          drafts. You confirm you have the right to upload whatever you upload.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Do not use CampVoice to create unlawful, deceptive, harassing or discriminatory content; do not upload
          another organisation&rsquo;s confidential material; do not upload camper health, medical or other sensitive
          information about a child; do not attempt to access another camp&rsquo;s data; and do not resell CampVoice
          output as a communications service to third parties without our written agreement.
        </p>
      </LegalSection>

      <LegalSection heading="Fair use">
        <p>
          The plan includes unlimited reasonable content generation. To protect service quality we apply per-day and
          per-minute limits that a normal camp will never reach. If your usage is far outside normal patterns we will
          contact you before taking any action.
        </p>
      </LegalSection>

      <LegalSection heading="Subscription and billing">
        <p>
          {pricing.planName} is {pricing.monthly.label}{pricing.monthly.suffix} or {pricing.annual.label}
          {pricing.annual.suffix}, billed through Stripe. New accounts include a {trial.days}-day free trial.
          Subscriptions renew automatically until cancelled. You can cancel at any time from your billing settings;
          access continues until the end of the period you have paid for. [ADD REFUND POLICY.]
        </p>
      </LegalSection>

      <LegalSection heading="Cancellation and termination">
        <p>
          You may cancel at any time. We may suspend or end an account that breaches these terms, and will tell you why.
          On termination you can export your content for [NUMBER] days.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          We aim to keep CampVoice available and working, but we do not promise uninterrupted service. Features may
          change as the product develops. [ADD ANY SERVICE-LEVEL COMMITMENT, IF YOU WANT TO MAKE ONE.]
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers and liability">
        <p>
          [THIS SECTION MUST BE WRITTEN BY COUNSEL. It should cover warranty disclaimers, limitation of liability, a
          liability cap, and indemnification, in a form that is enforceable in your jurisdiction.]
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>These terms are governed by the laws of [JURISDICTION], and disputes will be handled in [VENUE]. [CONFIRM WITH COUNSEL.]</p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms: <a className="text-forest-700 underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
