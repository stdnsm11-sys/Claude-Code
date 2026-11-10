import { z } from "zod";
import { ANIMATION_STYLES } from "@/config/animationStyles";
import { PAGE_COUNT } from "@/config/ageGroups";
import type { AnimationStyleId } from "@/types/book";

/** Request validation for API routes (the client is untrusted). */

const styleIds = Object.keys(ANIMATION_STYLES) as [AnimationStyleId, ...AnimationStyleId[]];

export const StoryConfigSchema = z.object({
  premise: z.string().trim().min(10, "Tell us a little more about the story (10+ characters)").max(2000),
  ageGroup: z.enum(["toddler", "early-reader", "middle-grade"]),
  pageCount: z.number().int().min(PAGE_COUNT.min).max(PAGE_COUNT.max),
  styleId: z.enum(styleIds),
  demoMode: z.boolean().default(false),
});

const CharacterSchema = z.object({
  id: z.string(),
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

export const CharacterBibleSchema = z.object({
  characters: z.array(CharacterSchema).min(1).max(3),
  worldNotes: z.string(),
  turnaroundPrompt: z.string(),
});

export const RenderPageInputSchema = z.object({
  pageNumber: z.number().int().min(1).max(PAGE_COUNT.max),
  sceneCompositionPrompt: z.string().max(4000),
  charactersPresent: z.array(z.string()),
  shotType: z.string(),
  mood: z.string(),
  seed: z.number().int().nonnegative().optional(),
});

/** Image URLs must be http(s) or our own inline data: URLs from the mock renderer. */
const ImageUrl = z
  .string()
  .max(2_000_000)
  .refine((u) => /^https:\/\//.test(u) || u.startsWith("data:image/"), "Unsupported reference image URL");

export const ReferenceRequestSchema = z.object({
  styleId: z.enum(styleIds),
  bible: CharacterBibleSchema,
  promptOverride: z.string().max(4000).optional(),
  seed: z.number().int().nonnegative().optional(),
  demoMode: z.boolean().default(false),
});

export const RenderRequestSchema = z.object({
  styleId: z.enum(styleIds),
  bible: CharacterBibleSchema,
  referenceImageUrl: ImageUrl,
  pages: z.array(RenderPageInputSchema).min(1).max(PAGE_COUNT.max),
  demoMode: z.boolean().default(false),
  /** Base seed; each page derives a stable seed from it unless overridden. */
  baseSeed: z.number().int().nonnegative().optional(),
});

export type RenderRequest = z.infer<typeof RenderRequestSchema>;
export type RenderPageInput = z.infer<typeof RenderPageInputSchema>;
export type ReferenceRequest = z.infer<typeof ReferenceRequestSchema>;

export function zodErrorMessage(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
}
