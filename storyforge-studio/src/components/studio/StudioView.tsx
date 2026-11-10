"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookEditor } from "@/components/book/BookEditor";
import { ANIMATION_STYLES } from "@/config/animationStyles";
import { AGE_GROUPS } from "@/config/ageGroups";
import { useRenderController } from "@/hooks/useRenderController";
import { cn } from "@/lib/utils";
import { useBookStore } from "@/store/useBookStore";
import type { BookStage } from "@/types/book";
import { CharacterBiblePanel } from "./CharacterBiblePanel";
import { ReferenceSheetPanel } from "./ReferenceSheetPanel";
import { RenderPanel } from "./RenderPanel";

const STEPS: { id: BookStage; label: string }[] = [
  { id: "reference", label: "Cast & reference" },
  { id: "rendering", label: "Illustrate" },
  { id: "editing", label: "Read & edit" },
];

export function StudioView({ bookId }: { bookId: string }) {
  const book = useBookStore((s) => s.book);
  const loadError = useBookStore((s) => s.loadError);
  const saving = useBookStore((s) => s.saving);
  const running = useBookStore((s) => s.render.running);
  const load = useBookStore((s) => s.load);
  const update = useBookStore((s) => s.update);
  const flush = useBookStore((s) => s.flush);
  const { start, cancel } = useRenderController();

  useEffect(() => {
    void load(bookId);
    return () => void flush();
  }, [bookId, load, flush]);

  if (loadError)
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">{loadError}</p>
        <Button asChild variant="outline">
          <Link href="/">Back to the studio</Link>
        </Button>
      </div>
    );
  if (!book || book.id !== bookId)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );

  const style = ANIMATION_STYLES[book.config.styleId];
  const stageIndex = STEPS.findIndex((s) => s.id === book.stage);
  const canVisit = (id: BookStage) =>
    !running && (id === "reference" || (book.reference.approved && (id === "rendering" || book.pages.some((p) => p.illustration.image))));

  function approve() {
    update((b) => ({ ...b, reference: { ...b.reference, approved: true }, stage: "rendering" }));
    // Re-render everything if the reference changed since the last render, otherwise only missing pages.
    const b = useBookStore.getState().book!;
    const refUrl = b.reference.image?.url;
    const stale = b.pages.some((p) => p.illustration.image && p.illustration.image.createdAt < (b.reference.image?.createdAt ?? ""));
    void start(stale && refUrl ? b.pages.map((p) => p.pageNumber) : undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All drafts
          </Link>
          <Input
            value={book.title}
            onChange={(e) => update((b) => ({ ...b, title: e.target.value }))}
            aria-label="Book title"
            className="h-auto border-transparent bg-transparent px-0 font-serif text-3xl shadow-none focus-visible:border-input focus-visible:px-2"
          />
          <p className="text-muted-foreground">{book.logline}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{style.label}</Badge>
            <Badge variant="secondary">{AGE_GROUPS[book.config.ageGroup].label}</Badge>
            <Badge variant="secondary">{book.pages.length} pages</Badge>
            {book.config.demoMode && <Badge variant="warning">Demo mode</Badge>}
            <span className="text-muted-foreground">{saving ? "Saving…" : "Saved locally"}</span>
          </div>
        </div>
        <ol className="flex items-center gap-2 text-sm" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                disabled={book.stage !== s.id && !canVisit(s.id)}
                onClick={() => update((b) => ({ ...b, stage: s.id }))}
                aria-current={book.stage === s.id ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  book.stage === s.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">
                  {i < stageIndex ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
            </li>
          ))}
        </ol>
      </div>

      {book.stage === "reference" && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ReferenceSheetPanel onApprove={approve} />
          <CharacterBiblePanel />
        </div>
      )}
      {book.stage === "rendering" && <RenderPanel onStart={(pages) => void start(pages)} onCancel={cancel} />}
      {book.stage === "editing" && <BookEditor />}
    </div>
  );
}
