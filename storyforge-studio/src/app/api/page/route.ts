import { RENDER_CONFIG } from "@/config/imageModels";
import { RenderRequestSchema, zodErrorMessage } from "@/lib/api/schemas";
import { createImageProvider } from "@/lib/image";
import { generatePageIllustration } from "@/lib/image/service";
import { randomSeed } from "@/lib/mock/random";
import { runQueue } from "@/lib/queue/renderQueue";
import { resolveProviders } from "@/lib/server/env";

export const maxDuration = 300;

/**
 * Regenerate a single page's illustration (tweaked prompt and/or seed) without
 * touching the rest of the book. Same composer + reference conditioning as the batch.
 */
export async function POST(request: Request) {
  const parsed = RenderRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const { styleId, bible, referenceImageUrl, demoMode } = parsed.data;
  const page = parsed.data.pages[0];
  if (parsed.data.pages.length !== 1) return Response.json({ error: "Send exactly one page" }, { status: 400 });

  const providers = resolveProviders(demoMode);
  const provider = createImageProvider(providers.image);
  const seed = page.seed ?? randomSeed();

  let image;
  let error: string | undefined;
  await runQueue(
    [
      {
        key: page.pageNumber,
        run: (signal) =>
          generatePageIllustration(
            provider,
            { styleId, bible, referenceImageUrl, page: { ...page, seed }, baseSeed: seed },
            signal,
          ),
      },
    ],
    { concurrency: 1, maxAttempts: RENDER_CONFIG.maxAttempts, signal: request.signal },
    {
      onSuccess: (_k, v) => (image = v),
      onFailure: (_k, e) => (error = e.message),
    },
  );
  if (!image) return Response.json({ error: error ?? "Cancelled" }, { status: 502 });
  return Response.json({ image });
}
