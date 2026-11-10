import { RENDER_CONFIG } from "@/config/imageModels";
import { RenderRequestSchema, zodErrorMessage } from "@/lib/api/schemas";
import { createImageProvider } from "@/lib/image";
import { generatePageIllustration } from "@/lib/image/service";
import { randomSeed } from "@/lib/mock/random";
import { runQueue } from "@/lib/queue/renderQueue";
import { resolveProviders } from "@/lib/server/env";
import { errorMessage } from "@/lib/server/errors";
import { encodeSse, type RenderEvent } from "@/lib/sse";

export const maxDuration = 800;

/**
 * Stage 2b: render every requested page through a concurrency-limited queue
 * and stream progress as Server-Sent Events. The client consumes this with
 * fetch() + a stream reader (POST body carries the bible + reference URL),
 * and closing the connection cancels outstanding work.
 */
export async function POST(request: Request) {
  const parsed = RenderRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  const { styleId, bible, referenceImageUrl, pages, demoMode } = parsed.data;
  const baseSeed = parsed.data.baseSeed ?? randomSeed();

  const providers = resolveProviders(demoMode);
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (e: RenderEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encodeSse(e));
        } catch {
          closed = true;
        }
      };

      try {
        const provider = createImageProvider(providers.image);
        const concurrency = provider.id === "mock" ? 4 : RENDER_CONFIG.concurrency;
        send({ type: "start", total: pages.length, provider: provider.id, model: provider.model, concurrency, notes: providers.notes });

        let completed = 0;
        let failed = 0;
        const progress = () => send({ type: "progress", completed, failed, total: pages.length });

        const result = await runQueue(
          pages.map((page) => ({
            key: page.pageNumber,
            run: (signal) =>
              generatePageIllustration(provider, { styleId, bible, referenceImageUrl, page, baseSeed }, signal),
          })),
          { concurrency, maxAttempts: RENDER_CONFIG.maxAttempts, signal: abort.signal },
          {
            onStart: (pageNumber, attempt) => send({ type: "page-start", pageNumber, attempt }),
            onRetry: (pageNumber, attempt, err, delayMs) =>
              send({ type: "page-retry", pageNumber, attempt, error: err.message, delayMs: Math.round(delayMs) }),
            onSuccess: (pageNumber, image) => {
              completed++;
              send({ type: "page-done", pageNumber, image });
              progress();
            },
            onFailure: (pageNumber, err) => {
              failed++;
              send({ type: "page-error", pageNumber, error: err.message });
              progress();
            },
          },
        );
        send({ type: "done", ...result });
      } catch (err) {
        console.error("[api/render]", err);
        send({ type: "fatal", error: errorMessage(err) });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed by client disconnect */
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
