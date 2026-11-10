/**
 * Provider/model specific knobs that are not style-dependent.
 * Everything here can be overridden from env without touching adapter code.
 */

export const IMAGE_SIZES = {
  /** Story pages — 4:3 landscape, matches the flipbook illustration panel. */
  page: { width: 1024, height: 768 },
  /** Turnaround sheet — wide so 3–4 views fit side by side. */
  reference: { width: 1344, height: 768 },
} as const;

export const FAL_CONFIG = {
  /** fal-ai/flux-general supports LoRAs, IP-Adapter and NAG negative prompts. */
  model: process.env.FAL_MODEL ?? "fal-ai/flux-general",
  ipAdapter: {
    path: process.env.FAL_IP_ADAPTER_PATH ?? "XLabs-AI/flux-ip-adapter",
    imageEncoderPath: process.env.FAL_IP_ADAPTER_ENCODER ?? "openai/clip-vit-large-patch14",
  },
  /**
   * flux-general applies negative_prompt via NAG (normalized attention guidance)
   * by default, so negatives work without doubling compute through real CFG.
   */
  nagScale: Number(process.env.FAL_NAG_SCALE ?? 3),
  /**
   * Optional "reference-only" attention guidance, stacked on top of the IP-Adapter.
   * 0 disables it. Try 0.4–0.65 if characters still drift between pages.
   */
  referenceStrength: Number(process.env.FAL_REFERENCE_STRENGTH ?? 0),
} as const;

export const REPLICATE_CONFIG = {
  model: (process.env.REPLICATE_MODEL ?? "black-forest-labs/flux-1.1-pro") as `${string}/${string}`,
  safetyTolerance: Number(process.env.REPLICATE_SAFETY_TOLERANCE ?? 2),
} as const;

export const RENDER_CONFIG = {
  concurrency: Math.max(1, Number(process.env.RENDER_CONCURRENCY ?? 3)),
  maxAttempts: Math.max(1, Number(process.env.RENDER_MAX_ATTEMPTS ?? 3)),
} as const;
