import { ReferenceRequestSchema, zodErrorMessage } from "@/lib/api/schemas";
import { createImageProvider } from "@/lib/image";
import { generateReferenceSheet } from "@/lib/image/service";
import { ImageProviderError } from "@/lib/image/types";
import { resolveProviders } from "@/lib/server/env";
import { errorMessage } from "@/lib/server/errors";

export const maxDuration = 300;

/** Stage 2a: generate (or regenerate) the Character Reference Turnaround Sheet. */
export async function POST(request: Request) {
  const parsed = ReferenceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const { styleId, bible, promptOverride, seed, demoMode } = parsed.data;

  const providers = resolveProviders(demoMode);
  try {
    const provider = createImageProvider(providers.image);
    const image = await generateReferenceSheet(provider, { styleId, bible, promptOverride, seed }, request.signal);
    return Response.json({ image, notes: providers.notes });
  } catch (err) {
    console.error("[api/character-sheet]", err);
    const status = err instanceof ImageProviderError && !err.retryable ? 422 : 502;
    return Response.json({ error: errorMessage(err) }, { status });
  }
}
