import { GLOBAL_NEGATIVE_PROMPT, type AnimationStyle } from "@/config/animationStyles";
import type { CharacterBible, CharacterProfile } from "@/types/book";

/**
 * Prompt composer: the single place where
 *   Animation Style modifiers + Character Bible descriptors + Scene Composition
 * are fused into the final provider prompt. Both the batch queue and the
 * single-page "Regenerate" path call this, so the two never drift apart.
 */

export interface ComposedPrompt {
  prompt: string;
  negativePrompt: string;
}

export interface PageSceneInput {
  sceneCompositionPrompt: string;
  charactersPresent: string[];
  shotType: string;
  mood: string;
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim().replace(/[.,;\s]+$/, "");

function loraTriggers(style: AnimationStyle): string[] {
  return style.loras.flatMap((l) => (l.triggerWord ? [l.triggerWord] : []));
}

/** Full descriptor used on the turnaround sheet (every bible field). */
export function describeCharacterFull(c: CharacterProfile): string {
  return clean(
    [
      `${c.name}: ${c.species}, ${c.ageDescriptor}`,
      c.proportions,
      c.skinOrFur,
      `hair: ${c.hair}`,
      `eyes: ${c.eyes}`,
      `wearing ${c.outfit}`,
      c.accessories.length ? `accessories: ${c.accessories.join(", ")}` : "",
      c.distinguishingFeatures.length ? `distinguishing features: ${c.distinguishingFeatures.join(", ")}` : "",
      c.colorPalette.length ? `palette: ${c.colorPalette.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(", "),
  );
}

export function composeReferencePrompt(
  style: AnimationStyle,
  bible: CharacterBible,
  promptOverride?: string,
): ComposedPrompt {
  const sheet = clean(promptOverride?.trim() || bible.turnaroundPrompt);
  const prompt = [
    ...loraTriggers(style),
    clean(style.prompt.prefix),
    sheet,
    ...bible.characters.map((c) => `(${describeCharacterFull(c)})`),
    "character model sheet, orthographic turnaround, front view, three-quarter view, side view, back view, evenly spaced, full body, consistent proportions across views",
    clean(style.prompt.turnaroundNotes),
    clean(style.prompt.suffix),
  ]
    .filter(Boolean)
    .join(", ");
  return {
    prompt,
    negativePrompt: [
      style.prompt.negative,
      GLOBAL_NEGATIVE_PROMPT,
      "busy background, scenery, dramatic perspective, overlapping characters, inconsistent outfits between views",
    ].join(", "),
  };
}

export function composePagePrompt(style: AnimationStyle, bible: CharacterBible, scene: PageSceneInput): ComposedPrompt {
  const present = scene.charactersPresent
    .map((id) => bible.characters.find((c) => c.id === id))
    .filter((c): c is CharacterProfile => Boolean(c));

  const cast =
    present.length > 0
      ? `featuring ${present.map((c) => `(${clean(c.consistencyTokens)})`).join(" and ")}`
      : "no characters, environment only";

  const prompt = [
    ...loraTriggers(style),
    clean(style.prompt.prefix),
    clean(scene.shotType),
    clean(scene.sceneCompositionPrompt),
    cast,
    bible.worldNotes ? `world: ${clean(bible.worldNotes)}` : "",
    scene.mood ? `mood: ${clean(scene.mood)}` : "",
    clean(style.prompt.suffix),
    "children's picture book illustration, clear storytelling composition, no text",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    prompt,
    negativePrompt: [style.prompt.negative, GLOBAL_NEGATIVE_PROMPT].join(", "),
  };
}

/** Stable per-page seed so re-running the queue reproduces the same images. */
export function derivePageSeed(baseSeed: number, pageNumber: number): number {
  return (baseSeed + pageNumber * 7919) % 2_147_483_647;
}
