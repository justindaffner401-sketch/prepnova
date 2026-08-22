import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Small, shared building blocks. Everything visual in CampVoice is assembled
 * from these plus the utility classes in globals.css, so the product stays
 * consistent without any component growing to a thousand lines.
 */

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const sizeClass: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return ["btn", variantClass[variant], sizeClass[size], extra].filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className = "", children, ...props }: ComponentProps<"div">) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">{title}</h2>
      {description ? <p className="mt-4 text-lg prose-camp">{description}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "forest" | "ember" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-paper-200 text-ink-700",
    forest: "bg-forest-50 text-forest-700",
    ember: "bg-ember-50 text-ember-700",
    success: "bg-forest-50 text-success-600",
    warning: "bg-ember-50 text-warning-600",
    danger: "bg-paper-200 text-danger-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      {icon ? <div className="mx-auto mb-4 text-forest-400">{icon}</div> : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 mx-auto max-w-md prose-camp">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/**
 * Error and success messages. `role="alert"` so screen readers announce them
 * the moment they appear.
 */
export function Alert({
  tone = "error",
  title,
  children,
}: {
  tone?: "error" | "success" | "info";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    error: "border-danger-600/25 bg-paper-200 text-danger-600",
    success: "border-forest-200 bg-forest-50 text-forest-700",
    info: "border-paper-400 bg-paper-200 text-ink-700",
  } as const;

  return (
    <div role="alert" className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  help,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? <span className="text-ember-600" aria-hidden="true"> *</span> : null}
        {!required ? <span className="ml-1.5 text-xs font-normal text-ink-300">optional</span> : null}
      </label>
      {children}
      {help ? (
        <p id={`${htmlFor}-help`} className="field-help">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="shimmer h-3.5 rounded" style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  );
}
