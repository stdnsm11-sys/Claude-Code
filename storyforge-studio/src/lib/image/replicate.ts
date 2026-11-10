import "server-only";
import Replicate from "replicate";
import { REPLICATE_CONFIG } from "@/config/imageModels";
import { ImageProviderError, type ImageGenerationRequest, type ImageGenerationResult, type ImageProvider } from "./types";

/**
 * black-forest-labs/flux-1.1-pro adapter.
 *  - Consistency: the character turnaround goes in `image_prompt` (FLUX Redux
 *    image prompting). It is weaker than an IP-Adapter: expect more drift.
 *  - flux-1.1-pro has no negative prompt or LoRA inputs; both are ignored.
 */
export class ReplicateFluxProProvider implements ImageProvider {
  readonly id = "replicate" as const;
  readonly model = REPLICATE_CONFIG.model;
  readonly supportsReference = true;
  readonly supportsNegativePrompt = false;
  private readonly client: Replicate;

  constructor(auth = process.env.REPLICATE_API_TOKEN) {
    if (!auth) throw new Error("REPLICATE_API_TOKEN is not set");
    this.client = new Replicate({ auth });
  }

  async generate(req: ImageGenerationRequest, signal?: AbortSignal): Promise<ImageGenerationResult> {
    // flux-1.1-pro custom sizes must be multiples of 32 within 256..1440.
    const fit = (n: number) => Math.min(1440, Math.max(256, Math.round(n / 32) * 32));
    const width = fit(req.width);
    const height = fit(req.height);
    const imagePrompt = req.reference && !req.reference.imageUrl.startsWith("data:") ? req.reference.imageUrl : undefined;

    try {
      const output = await this.client.run(this.model, {
        input: {
          prompt: req.prompt,
          aspect_ratio: "custom",
          width,
          height,
          seed: req.seed,
          output_format: "jpg",
          output_quality: 95,
          safety_tolerance: REPLICATE_CONFIG.safetyTolerance,
          prompt_upsampling: false,
          ...(imagePrompt ? { image_prompt: imagePrompt } : {}),
        },
        signal,
      });
      const url = extractUrl(output);
      if (!url) throw new ImageProviderError("Replicate returned no image", true);
      return { url, seed: req.seed, width, height };
    } catch (err) {
      if (err instanceof ImageProviderError || signal?.aborted) throw err;
      const status = (err as { response?: { status?: number } }).response?.status;
      const retryable = status === undefined || status === 429 || status >= 500;
      throw new ImageProviderError(`Replicate ${status ?? ""} ${(err as Error).message}`.trim(), retryable);
    }
  }
}

function extractUrl(output: unknown): string | undefined {
  const first = Array.isArray(output) ? output[0] : output;
  if (!first) return undefined;
  if (typeof first === "string") return first;
  if (typeof (first as { url?: unknown }).url === "function") return String((first as { url: () => URL }).url());
  return String(first);
}
