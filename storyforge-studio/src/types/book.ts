/**
 * Core domain types for StoryForge Studio.
 *
 * These are plain serialisable objects: they travel between the browser
 * (IndexedDB / zustand) and the stateless API routes as JSON, and map 1:1 onto
 * the Supabase tables sketched in `src/lib/storage/supabase.ts`.
 */

export type AgeGroupId = "toddler" | "early-reader" | "middle-grade";

export type AnimationStyleId =
  | "miyazaki-watercolor"
  | "3d-feature"
  | "golden-age-cel"
  | "stop-motion"
  | "vector-folklore"
  | "saturday-morning";

export interface StoryConfig {
  premise: string;
  ageGroup: AgeGroupId;
  pageCount: number; // 4..20
  styleId: AnimationStyleId;
  /** When true, every request is served by the mock LLM + mock image provider. */
  demoMode: boolean;
}

/** Exact, prompt-ready visual descriptors for one recurring character. */
export interface CharacterProfile {
  id: string; // slug, e.g. "pip"
  name: string;
  role: string; // "protagonist", "best friend", ...
  species: string;
  ageDescriptor: string;
  proportions: string; // "small and round, oversized head, short legs"
  skinOrFur: string;
  hair: string;
  eyes: string;
  outfit: string; // garments with exact colours
  accessories: string[];
  distinguishingFeatures: string[];
  colorPalette: string[]; // named colours, e.g. "rust orange", "cream"
  personality: string;
  /** Compressed comma-separated descriptor reused verbatim in every page prompt. */
  consistencyTokens: string;
}

export interface CharacterBible {
  characters: CharacterProfile[]; // 1..3
  /** Recurring locations / world notes so backgrounds stay coherent too. */
  worldNotes: string;
  /** Master prompt for the character reference turnaround sheet (style-agnostic). */
  turnaroundPrompt: string;
}

export type RenderStatus = "idle" | "queued" | "rendering" | "done" | "error";

export interface GeneratedImage {
  url: string;
  seed: number;
  /** The final positive prompt actually sent to the provider (for debugging / tweaking). */
  prompt: string;
  negativePrompt: string;
  provider: string;
  model: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface PageIllustration {
  status: RenderStatus;
  image?: GeneratedImage;
  error?: string;
  /** Previous renders, newest first — lets the user roll back a regeneration. */
  history?: GeneratedImage[];
}

export interface StoryPage {
  pageNumber: number;
  storyText: string;
  sceneCompositionPrompt: string;
  charactersPresent: string[]; // CharacterProfile ids
  shotType: string; // "wide establishing shot", "close-up", ...
  mood: string;
  /** Optional per-page seed override set from the editor. */
  seedOverride?: number;
  illustration: PageIllustration;
}

export interface CharacterReference {
  status: RenderStatus;
  approved: boolean;
  image?: GeneratedImage;
  error?: string;
  /** User-editable override of bible.turnaroundPrompt. */
  promptOverride?: string;
  history?: GeneratedImage[];
}

export type BookStage = "reference" | "rendering" | "editing";

export interface Book {
  id: string;
  title: string;
  logline: string;
  config: StoryConfig;
  bible: CharacterBible;
  reference: CharacterReference;
  pages: StoryPage[];
  stage: BookStage;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight row for draft lists. */
export interface BookSummary {
  id: string;
  title: string;
  styleId: AnimationStyleId;
  pageCount: number;
  stage: BookStage;
  coverUrl?: string;
  updatedAt: string;
}
