import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { StoryConfig } from "@/types/book";
import { ANTHROPIC_MODEL } from "@/lib/server/env";
import { STORY_DIRECTOR_SYSTEM, buildStoryDirectorUserPrompt } from "./prompts";
import { StoryPlanSchema, normalizeStoryPlan, type StoryPlan } from "./schemas";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export class StoryDirectorError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

/**
 * Stage 1: premise -> title, Character Bible, turnaround prompt and page plan.
 *
 * Uses structured outputs (JSON schema derived from Zod) so the response is
 * guaranteed to match StoryPlanSchema. Streams under the hood because a
 * 20-page plan plus adaptive thinking can be long; we only need the final message.
 * Server-side refusal fallbacks are enabled so a safety decline on the primary
 * model is retried on a fallback model inside the same call.
 */
export async function generateStoryPlan(config: StoryConfig): Promise<{ plan: StoryPlan; warnings: string[] }> {
  let message;
  try {
    const stream = getClient().beta.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(StoryPlanSchema),
      },
      system: [{ type: "text", text: STORY_DIRECTOR_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildStoryDirectorUserPrompt(config) }],
    });
    message = await stream.finalMessage();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new StoryDirectorError("Anthropic API key was rejected", 401);
    if (err instanceof Anthropic.RateLimitError) throw new StoryDirectorError("Anthropic rate limit hit, try again shortly", 429);
    if (err instanceof Anthropic.BadRequestError) throw new StoryDirectorError(`Story request rejected: ${err.message}`, 400);
    if (err instanceof Anthropic.APIError) throw new StoryDirectorError(`Anthropic API error ${err.status}: ${err.message}`);
    if (err instanceof Anthropic.APIConnectionError) throw new StoryDirectorError("Could not reach the Anthropic API");
    throw err;
  }

  if (message.stop_reason === "refusal") {
    const why = message.stop_details?.explanation ?? "the premise was declined by the safety system";
    throw new StoryDirectorError(`The Story Director declined this premise: ${why}`, 422);
  }
  if (message.stop_reason === "max_tokens") {
    throw new StoryDirectorError("The story plan was cut off before it finished; try fewer pages", 502);
  }

  let plan = message.parsed_output ?? null;
  if (!plan) {
    // Fall back to parsing the text block ourselves for a clearer error.
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = StoryPlanSchema.safeParse(safeJson(text));
    if (!parsed.success) throw new StoryDirectorError("The Story Director returned an unreadable plan");
    plan = parsed.data;
  }
  return normalizeStoryPlan(plan, config.pageCount);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
