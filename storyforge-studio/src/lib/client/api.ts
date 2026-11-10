"use client";

import type { StoryPlan } from "@/lib/llm/schemas";
import { readSse, type RenderEvent } from "@/lib/sse";
import type { Book, GeneratedImage, StoryConfig, StoryPage } from "@/types/book";

/** Typed browser-side wrappers around the API routes. */

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface ProviderStatus {
  llm: "anthropic" | "mock";
  llmModel: string;
  image: "fal" | "replicate" | "mock";
  imageModel: string;
  notes: string[];
}

export const fetchStatus = async (): Promise<ProviderStatus> => (await fetch("/api/status")).json();

export function createStoryPlan(config: StoryConfig, signal?: AbortSignal) {
  return postJson<{ plan: StoryPlan; warnings: string[]; provider: string; notes: string[] }>("/api/story", config, signal);
}

export function generateReference(book: Book, opts: { seed?: number; promptOverride?: string } = {}, signal?: AbortSignal) {
  return postJson<{ image: GeneratedImage; notes: string[] }>(
    "/api/character-sheet",
    {
      styleId: book.config.styleId,
      bible: book.bible,
      demoMode: book.config.demoMode,
      seed: opts.seed,
      promptOverride: opts.promptOverride ?? book.reference.promptOverride,
    },
    signal,
  );
}

const pageInput = (p: StoryPage, seed?: number) => ({
  pageNumber: p.pageNumber,
  sceneCompositionPrompt: p.sceneCompositionPrompt,
  charactersPresent: p.charactersPresent,
  shotType: p.shotType,
  mood: p.mood,
  seed: seed ?? p.seedOverride,
});

function renderBody(book: Book, pages: StoryPage[], baseSeed?: number) {
  if (!book.reference.image) throw new Error("Approve a character reference first");
  return {
    styleId: book.config.styleId,
    bible: book.bible,
    referenceImageUrl: book.reference.image.url,
    demoMode: book.config.demoMode,
    baseSeed,
    pages: pages.map((p) => pageInput(p)),
  };
}

/** Streams render progress events for the given pages. */
export async function* streamRender(book: Book, pages: StoryPage[], signal?: AbortSignal): AsyncGenerator<RenderEvent> {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(renderBody(book, pages, book.reference.image?.seed)),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Render failed (${res.status})`);
  }
  yield* readSse(res.body);
}

export function regeneratePage(book: Book, page: StoryPage, seed?: number, signal?: AbortSignal) {
  const body = renderBody(book, [page]);
  body.pages = [pageInput(page, seed)];
  return postJson<{ image: GeneratedImage }>("/api/page", body, signal);
}
