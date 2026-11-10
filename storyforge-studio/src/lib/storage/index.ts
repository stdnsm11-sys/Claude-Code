"use client";

import type { BookRepository } from "./types";
import { IndexedDbBookRepository } from "./indexedDb";

let repo: BookRepository | null = null;

/**
 * Single place that decides where books live. Swap in
 * `new SupabaseBookRepository(createClient(...))` here once Supabase is wired up.
 */
export function getBookRepository(): BookRepository {
  repo ??= new IndexedDbBookRepository();
  return repo;
}

export type { BookRepository } from "./types";
