import { z } from "zod";

/**
 * Structured-output contract for Stage 1 (Story & Character Bible).
 * Kept free of min/max constraints: the JSON-schema subset used by
 * structured outputs doesn't enforce them, so counts are normalised in code
 * (see normalizeStoryPlan).
 */
export const CharacterProfileSchema = z.object({
  id: z.string().describe("lowercase slug, unique, e.g. 'pip'"),
  name: z.string(),
  role: z.string(),
  species: z.string(),
  ageDescriptor: z.string(),
  proportions: z.string(),
  skinOrFur: z.string(),
  hair: z.string(),
  eyes: z.string(),
  outfit: z.string(),
  accessories: z.array(z.string()),
  distinguishingFeatures: z.array(z.string()),
  colorPalette: z.array(z.string()),
  personality: z.string(),
  consistencyTokens: z.string(),
});

export const StoryPageSchema = z.object({
  pageNumber: z.number().int(),
  storyText: z.string(),
  sceneCompositionPrompt: z.string(),
  charactersPresent: z.array(z.string()),
  shotType: z.string(),
  mood: z.string(),
});

export const StoryPlanSchema = z.object({
  title: z.string(),
  logline: z.string(),
  characterBible: z.object({
    characters: z.array(CharacterProfileSchema),
    worldNotes: z.string(),
    turnaroundPrompt: z.string(),
  }),
  pages: z.array(StoryPageSchema),
});

export type StoryPlan = z.infer<typeof StoryPlanSchema>;

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "character";

/** Enforce the invariants the rest of the pipeline relies on. */
export function normalizeStoryPlan(plan: StoryPlan, pageCount: number): { plan: StoryPlan; warnings: string[] } {
  const warnings: string[] = [];

  const seen = new Set<string>();
  const idMap = new Map<string, string>();
  const characters = plan.characterBible.characters.slice(0, 3).map((c) => {
    let id = slug(c.id || c.name);
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    idMap.set(c.id, id);
    idMap.set(c.name.toLowerCase(), id);
    return { ...c, id };
  });
  if (plan.characterBible.characters.length > 3) warnings.push("Trimmed character bible to 3 main characters");
  if (characters.length === 0) throw new Error("Story Director returned no characters");

  let pages = [...plan.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  if (pages.length > pageCount) {
    warnings.push(`Story Director returned ${pages.length} pages; trimmed to ${pageCount}`);
    pages = pages.slice(0, pageCount);
  } else if (pages.length < pageCount) {
    warnings.push(`Story Director returned ${pages.length} of ${pageCount} requested pages`);
  }
  if (pages.length === 0) throw new Error("Story Director returned no pages");

  pages = pages.map((p, i) => ({
    ...p,
    pageNumber: i + 1,
    charactersPresent: [
      ...new Set(
        p.charactersPresent
          .map((ref) => idMap.get(ref) ?? idMap.get(ref.toLowerCase()) ?? slug(ref))
          .filter((id) => seen.has(id)),
      ),
    ],
  }));

  return {
    plan: { ...plan, characterBible: { ...plan.characterBible, characters }, pages },
    warnings,
  };
}
