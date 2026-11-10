import "server-only";

export type LlmProviderId = "anthropic" | "mock";
export type ImageProviderId = "fal" | "replicate" | "mock";

export interface ResolvedProviders {
  llm: LlmProviderId;
  image: ImageProviderId;
  /** Why we fell back to mock, if we did — surfaced in the UI. */
  notes: string[];
}

const truthy = (v?: string) => v === "1" || v?.toLowerCase() === "true";

/**
 * Decide which real/mock providers serve a request.
 * Demo mode is forced when the client asks for it, when STORYFORGE_DEMO_MODE
 * is set, or when the credentials for the chosen provider are missing.
 */
export function resolveProviders(requestDemo = false): ResolvedProviders {
  const notes: string[] = [];
  const forceDemo = requestDemo || truthy(process.env.STORYFORGE_DEMO_MODE);
  if (forceDemo) return { llm: "mock", image: "mock", notes: ["Demo mode is on"] };

  let llm: LlmProviderId = "anthropic";
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    llm = "mock";
    notes.push("ANTHROPIC_API_KEY not set: using the mock Story Director");
  }

  const wanted = (process.env.IMAGE_PROVIDER ?? "fal").toLowerCase() as ImageProviderId;
  let image: ImageProviderId = wanted === "replicate" || wanted === "mock" ? wanted : "fal";
  if (image === "fal" && !process.env.FAL_KEY) {
    image = "mock";
    notes.push("FAL_KEY not set: using mock illustrations");
  }
  if (image === "replicate" && !process.env.REPLICATE_API_TOKEN) {
    image = "mock";
    notes.push("REPLICATE_API_TOKEN not set: using mock illustrations");
  }
  return { llm, image, notes };
}

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
