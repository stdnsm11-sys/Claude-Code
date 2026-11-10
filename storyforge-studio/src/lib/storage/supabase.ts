import type { Book, BookSummary } from "@/types/book";
import type { BookRepository } from "./types";

/**
 * Supabase-ready implementation stub.
 *
 * To enable:
 *   1. npm install @supabase/supabase-js
 *   2. Create the table below and set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   3. Pass a client into the constructor and set NEXT_PUBLIC_STORAGE=supabase
 *
 *   create table public.books (
 *     id          text primary key,
 *     owner_id    uuid references auth.users not null default auth.uid(),
 *     title       text not null,
 *     style_id    text not null,
 *     stage       text not null,
 *     page_count  int  not null,
 *     cover_url   text,
 *     data        jsonb not null,           -- the full Book document
 *     updated_at  timestamptz not null default now()
 *   );
 *   alter table public.books enable row level security;
 *   create policy "owner rw" on public.books using (owner_id = auth.uid()) with check (owner_id = auth.uid());
 *
 * Generated images should be copied to a Supabase Storage bucket rather than
 * relying on provider CDN URLs, which can expire.
 */

/** Minimal structural type so this file compiles without the dependency installed. */
interface SupabaseLike {
  from(table: string): {
    select(cols: string): any; // eslint-disable-line @typescript-eslint/no-explicit-any
    upsert(row: unknown): any; // eslint-disable-line @typescript-eslint/no-explicit-any
    delete(): any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

export class SupabaseBookRepository implements BookRepository {
  constructor(private readonly client: SupabaseLike) {}

  async list(): Promise<BookSummary[]> {
    const { data, error } = await this.client
      .from("books")
      .select("id,title,style_id,stage,page_count,cover_url,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      styleId: r.style_id as BookSummary["styleId"],
      stage: r.stage as BookSummary["stage"],
      pageCount: r.page_count as number,
      coverUrl: (r.cover_url as string) ?? undefined,
      updatedAt: r.updated_at as string,
    }));
  }

  async get(id: string): Promise<Book | undefined> {
    const { data, error } = await this.client.from("books").select("data").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data?.data as Book) ?? undefined;
  }

  async save(book: Book): Promise<void> {
    const cover = book.pages.find((p) => p.illustration.image)?.illustration.image?.url ?? book.reference.image?.url;
    const { error } = await this.client.from("books").upsert({
      id: book.id,
      title: book.title,
      style_id: book.config.styleId,
      stage: book.stage,
      page_count: book.pages.length,
      cover_url: cover ?? null,
      data: book,
      updated_at: book.updatedAt,
    });
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("books").delete().eq("id", id);
    if (error) throw error;
  }
}
