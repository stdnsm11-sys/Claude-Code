"use client";

import { useCallback, useEffect, useRef } from "react";
import { streamRender } from "@/lib/client/api";
import { useBookStore } from "@/store/useBookStore";
import type { StoryPage } from "@/types/book";

/**
 * Drives Stage 2b from the browser: posts the pages to /api/render, consumes the
 * SSE stream and writes each event into the store (which autosaves to IndexedDB).
 */
export function useRenderController() {
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = useCallback(async (pageNumbers?: number[]) => {
    const store = useBookStore.getState();
    const book = store.book;
    if (!book || store.render.running) return;

    const targets: StoryPage[] = book.pages.filter((p) =>
      pageNumbers ? pageNumbers.includes(p.pageNumber) : p.illustration.status !== "done",
    );
    if (targets.length === 0) {
      store.update((b) => ({ ...b, stage: "editing" }));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const targetSet = new Set(targets.map((t) => t.pageNumber));
    store.update((b) => ({
      ...b,
      stage: "rendering",
      pages: b.pages.map((p) =>
        targetSet.has(p.pageNumber) ? { ...p, illustration: { ...p.illustration, status: "queued", error: undefined } } : p,
      ),
    }));
    store.setRender({ running: true, completed: 0, failed: 0, total: targets.length, error: undefined, notes: [] });

    let failed = 0;
    let aborted = false;
    try {
      for await (const ev of streamRender(book, targets, controller.signal)) {
        const s = useBookStore.getState();
        switch (ev.type) {
          case "start":
            s.setRender({ provider: ev.provider, model: ev.model, concurrency: ev.concurrency, notes: ev.notes });
            break;
          case "page-start":
            s.setPageIllustration(ev.pageNumber, { status: "rendering" });
            break;
          case "page-retry":
            s.setPageIllustration(ev.pageNumber, { status: "rendering", error: `Retrying: ${ev.error}` });
            break;
          case "page-done":
            s.applyPageImage(ev.pageNumber, ev.image);
            break;
          case "page-error":
            s.setPageIllustration(ev.pageNumber, { status: "error", error: ev.error });
            break;
          case "progress":
            failed = ev.failed;
            s.setRender({ completed: ev.completed, failed: ev.failed, total: ev.total });
            break;
          case "done":
            aborted = ev.aborted;
            break;
          case "fatal":
            s.setRender({ error: ev.error });
            failed = targets.length;
            break;
        }
      }
    } catch (err) {
      if (controller.signal.aborted) aborted = true;
      else useBookStore.getState().setRender({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      const s = useBookStore.getState();
      // Anything still queued/rendering didn't finish (cancelled or stream dropped).
      s.update((b) => ({
        ...b,
        pages: b.pages.map((p) =>
          p.illustration.status === "queued" || p.illustration.status === "rendering"
            ? { ...p, illustration: { ...p.illustration, status: p.illustration.image ? "done" : "idle" } }
            : p,
        ),
      }));
      s.setRender({ running: false });
      if (!aborted && failed === 0 && !s.render.error) s.update((b) => ({ ...b, stage: "editing" }));
      await s.flush();
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { start, cancel };
}
