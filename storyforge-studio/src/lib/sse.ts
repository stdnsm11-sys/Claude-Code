/**
 * Render-progress event protocol, shared by the SSE route and the browser client.
 */
import type { GeneratedImage } from "@/types/book";

export type RenderEvent =
  | { type: "start"; total: number; provider: string; model: string; concurrency: number; notes: string[] }
  | { type: "page-start"; pageNumber: number; attempt: number }
  | { type: "page-retry"; pageNumber: number; attempt: number; error: string; delayMs: number }
  | { type: "page-done"; pageNumber: number; image: GeneratedImage }
  | { type: "page-error"; pageNumber: number; error: string }
  | { type: "progress"; completed: number; failed: number; total: number }
  | { type: "done"; succeeded: number; failed: number; aborted: boolean }
  | { type: "fatal"; error: string };

export function encodeSse(event: RenderEvent): Uint8Array {
  return new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

/** Parse an SSE byte stream from fetch() into RenderEvents (works for POST, unlike EventSource). */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<RenderEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const data = raw
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trimStart())
        .join("\n");
      if (data) yield JSON.parse(data) as RenderEvent;
    }
  }
}
