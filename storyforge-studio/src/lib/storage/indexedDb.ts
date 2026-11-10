"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Book, BookSummary } from "@/types/book";
import { toSummary, type BookRepository } from "./types";

interface StoryForgeDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: { "by-updated": string };
  };
}

const DB_NAME = "storyforge-studio";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StoryForgeDB>> | null = null;

function db() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment");
  }
  dbPromise ??= openDB<StoryForgeDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const store = database.createObjectStore("books", { keyPath: "id" });
      store.createIndex("by-updated", "updatedAt");
    },
  });
  return dbPromise;
}

export class IndexedDbBookRepository implements BookRepository {
  async list(): Promise<BookSummary[]> {
    const all = await (await db()).getAllFromIndex("books", "by-updated");
    return all.reverse().map(toSummary);
  }

  async get(id: string): Promise<Book | undefined> {
    return (await db()).get("books", id);
  }

  async save(book: Book): Promise<void> {
    await (await db()).put("books", book);
  }

  async delete(id: string): Promise<void> {
    await (await db()).delete("books", id);
  }
}
