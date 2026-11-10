import "server-only";
import { createFalClient, type FalClient } from "@fal-ai/client";
import { FAL_CONFIG } from "@/config/imageModels";
import { ImageProviderError, type ImageGenerationRequest, type ImageGenerationResult, type ImageProvider } from "./types";

/**
 * fal-ai/flux-general adapter.
 *  - LoRAs: forwarded from the style matrix.
 *  - Consistency: the character turnaround is passed as an IP-Adapter image
 *    (XLabs FLUX IP-Adapter by default), optionally stacked with
 *    reference-only attention guidance.
 *  - Negatives: flux-general applies negative_prompt via NAG.
 */
export class FalFluxGeneralProvider implements ImageProvider {
  readonly id = "fal" as const;
  readonly model = FAL_CONFIG.model;
  readonly supportsReference = true;
  readonly supportsNegativePrompt = true;
  private readonly client: FalClient;

  constructor(apiKey = process.env.FAL_KEY) {
    if (!apiKey) throw new Error("FAL_KEY is not set");
    this.client = createFalClient({ credentials: apiKey });
  }

  /** fal needs a fetchable URL; upload inline data: URLs (e.g. a mock reference) to fal storage first. */
  private async ensureRemoteUrl(url: string): Promise<string> {
    if (!url.startsWith("data:")) return url;
    const blob = await (await fetch(url)).blob();
    return this.client.storage.upload(blob);
  }

  async generate(req: ImageGenerationRequest, signal?: AbortSignal): Promise<ImageGenerationResult> {
    const referenceUrl = req.reference ? await this.ensureRemoteUrl(req.reference.imageUrl) : undefined;

    const input = {
      prompt: req.prompt,
      negative_prompt: req.negativePrompt,
      nag_scale: FAL_CONFIG.nagScale,
      image_size: { width: req.width, height: req.height },
      num_inference_steps: req.numInferenceSteps,
      guidance_scale: req.guidanceScale,
      seed: req.seed,
      num_images: 1,
      output_format: "jpeg" as const,
      enable_safety_checker: true,
      loras: req.loras.map((l) => ({ path: l.path, scale: l.scale })),
      ip_adapters:
        referenceUrl && req.reference
          ? [
              {
                path: FAL_CONFIG.ipAdapter.path,
                image_encoder_path: FAL_CONFIG.ipAdapter.imageEncoderPath,
                image_url: referenceUrl,
                scale: req.reference.scale,
              },
            ]
          : [],
      ...(referenceUrl && FAL_CONFIG.referenceStrength > 0
        ? { reference_image_url: referenceUrl, reference_strength: FAL_CONFIG.referenceStrength }
        : {}),
    };

    try {
      const result = await this.client.subscribe(this.model as "fal-ai/flux-general", {
        input,
        abortSignal: signal,
      });
      const image = result.data.images?.[0];
      if (!image?.url) throw new ImageProviderError("fal returned no image", true);
      if (result.data.has_nsfw_concepts?.[0]) {
        throw new ImageProviderError("The safety checker blocked this illustration; try rewording the scene", false);
      }
      return {
        url: image.url,
        seed: result.data.seed ?? req.seed,
        width: image.width ?? req.width,
        height: image.height ?? req.height,
      };
    } catch (err) {
      if (err instanceof ImageProviderError) throw err;
      if (signal?.aborted) throw err;
      const status = (err as { status?: number }).status;
      const body = (err as { body?: unknown }).body;
      const detail = body ? ` ${JSON.stringify(body).slice(0, 400)}` : "";
      const message = `fal ${status ?? ""} ${(err as Error).message ?? "request failed"}${detail}`.trim();
      // 4xx (bad input, auth) won't fix themselves; 429 / 5xx / network might.
      const retryable = status === undefined || status === 429 || status >= 500;
      throw new ImageProviderError(message, retryable);
    }
  }
}
