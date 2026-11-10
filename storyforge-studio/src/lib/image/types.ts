import type { LoraConfig } from "@/config/animationStyles";
import type { AnimationStyleId } from "@/types/book";

/**
 * Adapter contract every image backend implements. The render queue and API
 * routes depend only on this interface, so swapping fal-ai/flux-general for
 * black-forest-labs/flux-1.1-pro (or the mock) is a one-line factory change.
 */
export interface ImageGenerationRequest {
  kind: "reference" | "page";
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: number;
  guidanceScale: number;
  numInferenceSteps: number;
  loras: LoraConfig[];
  /** Character reference turnaround used for consistency (pages only). */
  reference?: { imageUrl: string; scale: number };
  /** Hints for the mock renderer; real providers ignore this. */
  meta: {
    styleId: AnimationStyleId;
    pageNumber?: number;
    mood?: string;
    title?: string;
    characters: { name: string; colors: string[] }[];
  };
}

export interface ImageGenerationResult {
  url: string;
  seed: number;
  width: number;
  height: number;
}

export interface ImageProvider {
  readonly id: "fal" | "replicate" | "mock";
  readonly model: string;
  /** True when the provider can actually condition on a reference image. */
  readonly supportsReference: boolean;
  /** True when negativePrompt is honoured. */
  readonly supportsNegativePrompt: boolean;
  generate(req: ImageGenerationRequest, signal?: AbortSignal): Promise<ImageGenerationResult>;
}

export class ImageProviderError extends Error {
  constructor(
    message: string,
    /** Whether the queue should retry this failure. */
    readonly retryable: boolean,
  ) {
    super(message);
  }
}
