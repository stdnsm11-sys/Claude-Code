import type { Book, BookSummary } from "@/types/book";

/**
 * Persistence boundary. The UI only ever talks to this interface, so moving
 * from local IndexedDB drafts to Supabase (or anything else) is a matter of
 * providing another implementation in `src/lib/storage/index.ts`.
 */
export interface BookRepository {
  list(): Promise<BookSummary[]>;
  get(id: string): Promise<Book | undefined>;
  save(book: Book): Promise<void>;
  delete(id: string): Promise<void>;
}

export function toSummary(book: Book): BookSummary {
  const cover = book.pages.find((p) => p.illustration.image)?.illustration.image?.url ?? book.reference.image?.url;
  return {
    id: book.id,
    title: book.title,
    styleId: book.config.styleId,
    pageCount: book.pages.length,
    stage: book.stage,
    coverUrl: cover,
    updatedAt: book.updatedAt,
  };
}
