import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The cookies CampVoice uses and why.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="[DATE]">
      <LegalSection heading="The short version">
        <p>
          CampVoice uses cookies for one thing: keeping you signed in. We do not run advertising cookies, and we do not
          use third-party tracking pixels.
        </p>
      </LegalSection>

      <LegalSection heading="Essential cookies">
        <p>
          Our authentication provider, Supabase, sets cookies that hold your signed-in session. Without them you would be
          logged out on every page. These are strictly necessary for the service to work, so they are set when you sign
          in and cannot be turned off while you are using the app.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics">
        <p>
          Product analytics are recorded in our own database against your account, not through a third-party cookie. We
          record which features were used and when, never the content of your communications. If we add a third-party
          analytics provider in future we will update this page and add a consent banner before it loads.
        </p>
      </LegalSection>

      <LegalSection heading="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings. Blocking the essential session cookie will prevent you
          from signing in.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
        <p>
          <a className="text-forest-700 underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
