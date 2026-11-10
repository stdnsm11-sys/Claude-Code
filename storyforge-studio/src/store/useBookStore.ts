"use client";

import { create } from "zustand";
import { getBookRepository } from "@/lib/storage";
import type { Book, GeneratedImage, PageIllustration, StoryPage } from "@/types/book";

const HISTORY_LIMIT = 6;

interface RenderRun {
  running: boolean;
  provider?: string;
  model?: string;
  concurrency?: number;
  completed: number;
  failed: number;
  total: number;
  notes: string[];
  error?: string;
}

interface BookState {
  book: Book | null;
  loadError: string | null;
  saving: boolean;
  render: RenderRun;

  load(id: string): Promise<void>;
  /** Immutable update + debounced autosave to the repository. */
  update(mutator: (draft: Book) => Book): void;
  updatePage(pageNumber: number, patch: Partial<StoryPage>): void;
  setPageIllustration(pageNumber: number, patch: Partial<PageIllustration>): void;
  /** Push a new image, keeping the previous one in history. */
  applyPageImage(pageNumber: number, image: GeneratedImage): void;
  applyReferenceImage(image: GeneratedImage): void;
  setRender(patch: Partial<RenderRun>): void;
  flush(): Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

const emptyRun: RenderRun = { running: false, completed: 0, failed: 0, total: 0, notes: [] };

export const useBookStore = create<BookState>((set, get) => {
  const persist = async () => {
    const book = get().book;
    if (!book) return;
    set({ saving: true });
    try {
      await getBookRepository().save(book);
    } finally {
      set({ saving: false });
    }
  };

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void persist();
    }, 400);
  };

  const pushHistory = (current: GeneratedImage | undefined, history: GeneratedImage[] = []) =>
    current ? [current, ...history.filter((h) => h.url !== current.url)].slice(0, HISTORY_LIMIT) : history;

  return {
    book: null,
    loadError: null,
    saving: false,
    render: emptyRun,

    async load(id) {
      set({ book: null, loadError: null, render: emptyRun });
      const book = await getBookRepository().get(id);
      if (!book) {
        set({ loadError: "This storybook could not be found in local drafts." });
        return;
      }
      // Any render interrupted by a reload/navigation is no longer in flight.
      const pages = book.pages.map((p) =>
        p.illustration.status === "rendering" || p.illustration.status === "queued"
          ? { ...p, illustration: { ...p.illustration, status: p.illustration.image ? ("done" as const) : ("idle" as const) } }
          : p,
      );
      const reference =
        book.reference.status === "rendering"
          ? { ...book.reference, status: book.reference.image ? ("done" as const) : ("idle" as const) }
          : book.reference;
      set({ book: { ...book, pages, reference } });
    },

    update(mutator) {
      const book = get().book;
      if (!book) return;
      set({ book: { ...mutator(book), updatedAt: new Date().toISOString() } });
      scheduleSave();
    },

    updatePage(pageNumber, patch) {
      get().update((b) => ({
        ...b,
        pages: b.pages.map((p) => (p.pageNumber === pageNumber ? { ...p, ...patch } : p)),
      }));
    },

    setPageIllustration(pageNumber, patch) {
      get().update((b) => ({
        ...b,
        pages: b.pages.map((p) =>
          p.pageNumber === pageNumber ? { ...p, illustration: { ...p.illustration, ...patch } } : p,
        ),
      }));
    },

    applyPageImage(pageNumber, image) {
      get().update((b) => ({
        ...b,
        pages: b.pages.map((p) =>
          p.pageNumber === pageNumber
            ? {
                ...p,
                illustration: {
                  status: "done",
                  image,
                  error: undefined,
                  history: pushHistory(p.illustration.image, p.illustration.history),
                },
              }
            : p,
        ),
      }));
    },

    applyReferenceImage(image) {
      get().update((b) => ({
        ...b,
        reference: {
          ...b.reference,
          status: "done",
          approved: false,
          image,
          error: undefined,
          history: pushHistory(b.reference.image, b.reference.history),
        },
      }));
    },

    setRender(patch) {
      set({ render: { ...get().render, ...patch } });
    },

    async flush() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      await persist();
    },
  };
});
