import { StoryConfigSchema, zodErrorMessage } from "@/lib/api/schemas";
import { normalizeStoryPlan } from "@/lib/llm/schemas";
import { StoryDirectorError, generateStoryPlan } from "@/lib/llm/storyDirector";
import { mockStoryPlan } from "@/lib/mock/mockStory";
import { sleep } from "@/lib/mock/random";
import { resolveProviders } from "@/lib/server/env";

export const maxDuration = 300;

/** Stage 1: premise -> Story plan + Character Bible. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = StoryConfigSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const config = parsed.data;
  const providers = resolveProviders(config.demoMode);

  try {
    if (providers.llm === "mock") {
      await sleep(900);
      const { plan, warnings } = normalizeStoryPlan(mockStoryPlan(config), config.pageCount);
      return Response.json({ plan, warnings, provider: "mock", notes: providers.notes });
    }
    const { plan, warnings } = await generateStoryPlan(config);
    return Response.json({ plan, warnings, provider: "anthropic", notes: providers.notes });
  } catch (err) {
    if (err instanceof StoryDirectorError) return Response.json({ error: err.message }, { status: err.status });
    console.error("[api/story]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Story generation failed" }, { status: 500 });
  }
}
