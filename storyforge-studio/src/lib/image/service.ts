import "server-only";
import { getAnimationStyle } from "@/config/animationStyles";
import { IMAGE_SIZES } from "@/config/imageModels";
import { composePagePrompt, composeReferencePrompt, derivePageSeed } from "@/lib/prompt/composePrompt";
import { randomSeed } from "@/lib/mock/random";
import type { AnimationStyleId, CharacterBible, GeneratedImage } from "@/types/book";
import type { RenderPageInput } from "@/lib/api/schemas";
import type { ImageProvider } from "./types";

const metaCharacters = (bible: CharacterBible, ids?: string[]) =>
  bible.characters
    .filter((c) => !ids || ids.includes(c.id))
    .map((c) => ({ name: c.name, colors: c.colorPalette }));

/** Stage 2a: render the character reference turnaround sheet. */
export async function generateReferenceSheet(
  provider: ImageProvider,
  args: { styleId: AnimationStyleId; bible: CharacterBible; promptOverride?: string; seed?: number },
  signal?: AbortSignal,
): Promise<GeneratedImage> {
  const style = getAnimationStyle(args.styleId);
  const { prompt, negativePrompt } = composeReferencePrompt(style, args.bible, args.promptOverride);
  const seed = args.seed ?? randomSeed();
  const { width, height } = IMAGE_SIZES.reference;
  const result = await provider.generate(
    {
      kind: "reference",
      prompt,
      negativePrompt,
      width,
      height,
      seed,
      guidanceScale: style.generation.guidanceScale,
      numInferenceSteps: style.generation.numInferenceSteps,
      loras: style.loras,
      meta: { styleId: style.id, characters: metaCharacters(args.bible) },
    },
    signal,
  );
  return {
    url: result.url,
    seed: result.seed,
    prompt,
    negativePrompt,
    provider: provider.id,
    model: provider.model,
    width: result.width,
    height: result.height,
    createdAt: new Date().toISOString(),
  };
}

/** Stage 2b: render one story page, conditioned on the approved reference sheet. */
export async function generatePageIllustration(
  provider: ImageProvider,
  args: {
    styleId: AnimationStyleId;
    bible: CharacterBible;
    referenceImageUrl: string;
    page: RenderPageInput;
    baseSeed: number;
  },
  signal?: AbortSignal,
): Promise<GeneratedImage> {
  const style = getAnimationStyle(args.styleId);
  const { prompt, negativePrompt } = composePagePrompt(style, args.bible, args.page);
  const seed = args.page.seed ?? derivePageSeed(args.baseSeed, args.page.pageNumber);
  const { width, height } = IMAGE_SIZES.page;
  // Pages without characters don't need (and shouldn't inherit poses from) the turnaround sheet.
  const useReference = args.page.charactersPresent.length > 0;
  const result = await provider.generate(
    {
      kind: "page",
      prompt,
      negativePrompt,
      width,
      height,
      seed,
      guidanceScale: style.generation.guidanceScale,
      numInferenceSteps: style.generation.numInferenceSteps,
      loras: style.loras,
      reference: useReference ? { imageUrl: args.referenceImageUrl, scale: style.generation.referenceScale } : undefined,
      meta: {
        styleId: style.id,
        pageNumber: args.page.pageNumber,
        mood: args.page.mood,
        characters: metaCharacters(args.bible, args.page.charactersPresent),
      },
    },
    signal,
  );
  return {
    url: result.url,
    seed: result.seed,
    prompt,
    negativePrompt,
    provider: provider.id,
    model: provider.model,
    width: result.width,
    height: result.height,
    createdAt: new Date().toISOString(),
  };
}
