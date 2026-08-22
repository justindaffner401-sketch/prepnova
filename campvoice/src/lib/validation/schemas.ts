import { z } from "zod";
import { limits } from "@/lib/config";
import { TEMPLATES } from "@/lib/ai/templates";

/**
 * Every piece of data that arrives from a browser is validated here before it
 * touches the database or the AI. Nothing trusts the client.
 */

export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200);

export const passwordSchema = z
  .string()
  .min(10, "Please use at least 10 characters.")
  .max(200, "That password is too long.");

export const signUpSchema = z.object({
  full_name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Please enter your password.").max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, {
    message: "Those passwords do not match.",
    path: ["confirm"],
  });

// ------------------------------- onboarding -------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const campBasicsSchema = z.object({
  name: z.string().trim().min(2, "Please enter your camp's name.").max(160),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(value), {
      message: "Please enter a full web address, starting with https://",
    }),
  location: optionalText(160),
  camp_type: optionalText(80),
  age_range: optionalText(80),
  description: optionalText(2000),
});

export const campDetailsSchema = z.object({
  programs: optionalText(4000),
  traditions: optionalText(4000),
  terminology: z
    .array(
      z.object({
        standard_term: z.string().trim().min(1).max(80),
        camp_term: z.string().trim().min(1).max(80),
        note: optionalText(200),
      }),
    )
    .max(40)
    .default([]),
});

export const VOICE_TRAITS = [
  "Warm",
  "Energetic",
  "Professional",
  "Playful",
  "Premium",
  "Nostalgic",
  "Concise",
  "Enthusiastic",
  "Reassuring",
  "Community-focused",
] as const;

export const campVoiceSchema = z.object({
  voice_traits: z.array(z.enum(VOICE_TRAITS)).max(VOICE_TRAITS.length).default([]),
  avoid_list: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  audience: optionalText(1000),
  communication_notes: optionalText(2000),
});

export const pasteExamplesSchema = z.object({
  pasted_examples: z.string().trim().max(limits.maxPastedChars).optional().default(""),
});

export const websiteImportSchema = z.object({
  url: z
    .string()
    .trim()
    .min(4)
    .max(300)
    .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`)),
});

export const EVENT_TYPES = [
  "enrollment_opens",
  "camp_start",
  "camp_end",
  "visiting_day",
  "open_house",
  "reunion",
  "staff_arrival",
  "staff_applications",
  "deadline",
  "custom",
] as const;

export const campEventSchema = z
  .object({
    title: z.string().trim().min(1, "Please name this date.").max(160),
    event_type: z.enum(EVENT_TYPES).default("custom"),
    starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date."),
    ends_on: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : null)),
    notes: optionalText(500),
  })
  .refine((data) => !data.ends_on || data.ends_on >= data.starts_on, {
    message: "The end date cannot be before the start date.",
    path: ["ends_on"],
  });

export const campDnaEditSchema = z.object({
  voice_summary: z.string().trim().max(2000).default(""),
  terminology_summary: z.string().trim().max(2000).default(""),
  core_themes: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  style_notes: z.string().trim().max(2000).default(""),
  audience_notes: z.string().trim().max(2000).default(""),
  avoid_notes: z.string().trim().max(2000).default(""),
});

// ------------------------------ generation ------------------------------

const templateIds = TEMPLATES.map((template) => template.id) as [string, ...string[]];

export const generateSchema = z.object({
  template_id: z.enum(templateIds),
  /** Free-text answers from the template's own form. Keys are checked against the template. */
  inputs: z.record(z.string(), z.string().max(4000)).default({}),
});

export const REVISION_ACTION_IDS = [
  "shorter",
  "warmer",
  "energetic",
  "professional",
  "less-ai",
  "more-camp",
  "another",
  "custom",
] as const;

export const reviseSchema = z.object({
  content_id: z.uuid(),
  action: z.enum(REVISION_ACTION_IDS),
  custom_instruction: z.string().trim().max(600).optional(),
});

export const saveContentSchema = z.object({
  content_id: z.uuid(),
  edited_output: z.string().max(40000).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  is_favorite: z.boolean().optional(),
  status: z.enum(["draft", "saved", "archived"]).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: emailSchema,
  camp_name: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(10, "Please add a little more detail.").max(4000),
  /** Honeypot: must stay empty. */
  website: z.string().max(200).optional().default(""),
  elapsed_ms: z.number().int().nonnegative().optional().default(0),
});

export const checkoutSchema = z.object({
  interval: z.enum(["month", "year"]),
});
