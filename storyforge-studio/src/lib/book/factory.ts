import { nanoid } from "nanoid";
import type { StoryPlan } from "@/lib/llm/schemas";
import type { Book, StoryConfig } from "@/types/book";

export function createBookFromPlan(plan: StoryPlan, config: StoryConfig): Book {
  const now = new Date().toISOString();
  return {
    id: nanoid(10),
    title: plan.title,
    logline: plan.logline,
    config,
    bible: plan.characterBible,
    reference: { status: "idle", approved: false },
    pages: plan.pages.map((p) => ({ ...p, illustration: { status: "idle" } })),
    stage: "reference",
    createdAt: now,
    updatedAt: now,
  };
}
