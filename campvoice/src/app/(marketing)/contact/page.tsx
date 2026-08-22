import type { Metadata } from "next";
import { brand } from "@/lib/config";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the CampVoice team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Talk to a person.</h1>
        <p className="mt-4 prose-camp">
          Questions about whether CampVoice fits your camp, help getting your Camp DNA right, or something that is not
          working — we would rather hear about it.
        </p>
        <div className="card mt-8 p-5">
          <p className="text-sm font-semibold text-ink-900">Email us directly</p>
          <a
            href={`mailto:${brand.supportEmail}`}
            className="mt-1 inline-block text-forest-700 underline underline-offset-4"
          >
            {brand.supportEmail}
          </a>
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
