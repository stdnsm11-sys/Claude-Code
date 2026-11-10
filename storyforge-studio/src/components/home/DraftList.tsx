"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ANIMATION_STYLES } from "@/config/animationStyles";
import { getBookRepository } from "@/lib/storage";
import type { BookSummary } from "@/types/book";

const STAGE_LABEL: Record<BookSummary["stage"], string> = {
  reference: "Designing cast",
  rendering: "Illustrating",
  editing: "Ready",
};

export function DraftList() {
  const [drafts, setDrafts] = useState<BookSummary[] | null>(null);

  useEffect(() => {
    getBookRepository()
      .list()
      .then(setDrafts)
      .catch(() => setDrafts([]));
  }, []);

  if (!drafts?.length) return null;

  async function remove(id: string) {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    await getBookRepository().delete(id);
    setDrafts((d) => d?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl">Your drafts</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {drafts.map((d) => (
          <div key={d.id} className="group relative overflow-hidden rounded-xl border bg-card">
            <Link href={`/studio/${d.id}`} className="block">
              <div className="aspect-[4/3] bg-muted">
                {d.coverUrl && <img src={d.coverUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="space-y-1 p-3">
                <div className="line-clamp-1 font-semibold">{d.title}</div>
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <Badge variant={d.stage === "editing" ? "success" : "secondary"}>{STAGE_LABEL[d.stage]}</Badge>
                  <span>{ANIMATION_STYLES[d.styleId]?.label}</span>·<span>{d.pageCount} pages</span>
                </div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-background/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => remove(d.id)}
              aria-label={`Delete ${d.title}`}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
