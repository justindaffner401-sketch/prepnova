"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import type { ContentTemplate, TemplateField } from "@/lib/ai/templates";

/**
 * The structured generation form.
 *
 * THE MOST IMPORTANT UX RULE IN CAMPVOICE lives here: a camp director answers
 * plain questions. They never write a prompt, and they never see one.
 */
export function GenerationForm({
  template,
  prefill = {},
}: {
  template: ContentTemplate;
  prefill?: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(template, prefill));
  const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
  const [error, setError] = useState("");

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("generating");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: template.id, inputs: values }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setError(body?.error?.message ?? "We couldn't generate this right now. Your information is safe. Try again.");
        return;
      }

      router.push(`/content/${body.content.id}?new=1`);
    } catch {
      setStatus("error");
      setError("We couldn't reach our server. Please check your connection and try again.");
    }
  }

  if (status === "generating") {
    return <GeneratingState templateLabel={template.label} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {status === "error" ? <Alert tone="error">{error}</Alert> : null}

      {template.fields.map((field) => (
        <TemplateFieldInput
          key={field.name}
          field={field}
          value={values[field.name] ?? ""}
          onChange={(value) => setValue(field.name, value)}
        />
      ))}

      <Button type="submit" size="lg">
        Generate
      </Button>
    </form>
  );
}

function initialValues(template: ContentTemplate, prefill: Record<string, string>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of template.fields) {
    const prefilled = prefill[field.name];
    if (prefilled) {
      values[field.name] = prefilled;
    } else if (field.type === "radio" && field.options?.[0] && field.required) {
      // Preselect a sensible default so the form is never in an invalid state.
      values[field.name] = field.name === "length" ? "standard" : field.options[0].value;
    } else {
      values[field.name] = "";
    }
  }
  return values;
}

function TemplateFieldInput({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.name}`;

  if (field.type === "radio" && field.options) {
    return (
      <fieldset>
        <legend className="field-label">
          {field.label}
          {field.required ? <span className="text-ember-600" aria-hidden="true"> *</span> : null}
        </legend>
        {field.help ? <p className="field-help mt-1">{field.help}</p> : null}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {field.options.map((option) => {
            const optionId = `${id}-${option.value}`;
            const checked = value === option.value;
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={`chip cursor-pointer ${checked ? "chip-selected" : "hover:bg-paper-300"}`}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={checked}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <Field label={field.label} htmlFor={id} help={field.help} required={field.required}>
        <select id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose one</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </Field>
    );
  }

  if (field.type === "textarea") {
    return (
      <Field label={field.label} htmlFor={id} help={field.help} required={field.required}>
        <textarea
          id={id}
          className="input"
          rows={4}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={field.help ? `${id}-help` : undefined}
        />
      </Field>
    );
  }

  return (
    <Field label={field.label} htmlFor={id} help={field.help} required={field.required}>
      <input
        id={id}
        type={field.type === "date" ? "date" : "text"}
        className="input"
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={field.help ? `${id}-help` : undefined}
      />
    </Field>
  );
}

/**
 * Honest loading copy. We do not show a percentage, because we cannot actually
 * measure progress — a fake progress bar is worse than none.
 */
const STAGES = ["Reviewing your Camp DNA…", "Writing in your camp's voice…", "Preparing your draft…"];

function GeneratingState({ templateLabel }: { templateLabel: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStage((value) => Math.min(value + 1, STAGES.length - 1)), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-10 text-center" role="status" aria-live="polite">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50">
        <svg className="h-6 w-6 animate-spin text-forest-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
        </svg>
      </div>

      <p className="mt-5 font-display text-xl font-semibold">{STAGES[stage]}</p>
      <p className="mt-2 text-sm text-ink-300">Writing your {templateLabel.toLowerCase()}. This usually takes a few seconds.</p>

      <div className="mx-auto mt-8 max-w-md space-y-2.5" aria-hidden="true">
        {[100, 92, 96, 70].map((width, index) => (
          <div key={index} className="shimmer h-3 rounded" style={{ width: `${width}%` }} />
        ))}
      </div>
    </div>
  );
}
