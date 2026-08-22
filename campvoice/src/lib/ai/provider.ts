import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { ai } from "@/lib/config";
import { logger } from "@/lib/logger";

/**
 * The ONLY place in CampVoice that talks to an AI provider.
 *
 * Everything above this file works with plain strings and objects, so swapping
 * the model — or one day the provider — means changing this file and nothing
 * else. Which model is used is set in src/lib/config.ts via environment
 * variables.
 */

export class AiUnavailableError extends Error {
  constructor(readonly reason: "not_configured" | "rate_limited" | "refused" | "failed", message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

export interface AiResult<T> {
  value: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError("not_configured", "The AI provider is not configured.");
  }
  cachedClient ??= new Anthropic({ maxRetries: 2, timeout: 120_000 });
  return cachedClient;
}

interface CallOptions {
  /** Which configured model to use. */
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  /** Adaptive thinking helps on judgement-heavy work like building Camp DNA. */
  think?: boolean;
}

/**
 * If the model declines a request on policy grounds, the API automatically
 * retries it on a fallback model inside the same call. Camp communications
 * should never trip a policy classifier, but this means an odd edge case
 * degrades into a normal draft instead of an error.
 */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

function toAiError(error: unknown): AiUnavailableError {
  if (error instanceof AiUnavailableError) return error;
  if (error instanceof Anthropic.RateLimitError) {
    return new AiUnavailableError("rate_limited", "The AI service is busy right now.");
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return new AiUnavailableError("not_configured", "The AI provider rejected our credentials.");
  }
  return new AiUnavailableError("failed", "The AI service did not respond successfully.");
}

/** Plain-text generation — the path used for every camp communication. */
export async function generateText(options: CallOptions): Promise<AiResult<string>> {
  const client = getClient();
  const model = options.model || ai.generationModel;

  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: options.maxTokens ?? ai.maxOutputTokens,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      ...(options.think ? { thinking: { type: "adaptive" as const } } : {}),
      system: options.system,
      messages: [{ role: "user", content: options.user }],
    });

    if (response.stop_reason === "refusal") {
      throw new AiUnavailableError("refused", "The AI declined to write this content.");
    }

    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      throw new AiUnavailableError("failed", "The AI returned an empty response.");
    }

    return {
      value: text,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (error) {
    const aiError = toAiError(error);
    logger.error("ai.generate_text", error, { model, reason: aiError.reason });
    throw aiError;
  }
}

/**
 * Structured generation — used where CampVoice needs reliable fields back
 * (the Camp DNA summary, weekly suggestions) rather than free prose.
 */
export async function generateStructured<S extends z.ZodType>(
  options: CallOptions & { schema: S },
): Promise<AiResult<z.infer<S>>> {
  const client = getClient();
  const model = options.model || ai.utilityModel;

  try {
    const response = await client.messages.parse({
      model,
      max_tokens: options.maxTokens ?? ai.maxOutputTokens,
      ...(options.think ? { thinking: { type: "adaptive" as const } } : {}),
      system: options.system,
      messages: [{ role: "user", content: options.user }],
      output_config: { format: zodOutputFormat(options.schema) },
    });

    if (response.stop_reason === "refusal") {
      throw new AiUnavailableError("refused", "The AI declined this request.");
    }
    if (response.parsed_output == null) {
      throw new AiUnavailableError("failed", "The AI response did not match the expected shape.");
    }

    return {
      value: response.parsed_output as z.infer<S>,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (error) {
    const aiError = toAiError(error);
    logger.error("ai.generate_structured", error, { model, reason: aiError.reason });
    throw aiError;
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
