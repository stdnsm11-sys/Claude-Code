"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfExportButton } from "@/components/export/PdfExportButton";
import { cn } from "@/lib/utils";
import { useBookStore } from "@/store/useBookStore";
import { PageEditorPanel } from "./PageEditorPanel";

// react-pageflip touches window/DOM on import, so it is client-only.
const Flipbook = dynamic(() => import("./Flipbook"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center text-muted-foreground">
      <Loader2 className="animate-spin" />
    </div>
  ),
});

export function BookEditor() {
  const book = useBookStore((s) => s.book);
  const [selected, setSelected] = useState(1);
  if (!book) return null;
  const n = book.pages.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label="Previous page" disabled={selected <= 1} onClick={() => setSelected((s) => s - 1)}>
              <ChevronLeft />
            </Button>
            <span className="w-24 text-center text-sm">
              Page {selected} of {n}
            </span>
            <Button variant="outline" size="icon" aria-label="Next page" disabled={selected >= n} onClick={() => setSelected((s) => s + 1)}>
              <ChevronRight />
            </Button>
          </div>
          <PdfExportButton book={book} />
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-stone-200 to-stone-300 p-4 shadow-inner sm:p-8 dark:from-stone-800 dark:to-stone-900">
          <Flipbook book={book} targetPage={selected} onPageChange={setSelected} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Pages">
          {book.pages.map((p) => (
            <button
              key={p.pageNumber}
              role="tab"
              aria-selected={p.pageNumber === selected}
              onClick={() => setSelected(p.pageNumber)}
              className={cn(
                "relative w-24 shrink-0 overflow-hidden rounded-md border bg-card text-left transition-shadow hover:shadow",
                p.pageNumber === selected && "ring-2 ring-primary",
              )}
            >
              <div className="aspect-[4/3] bg-muted">
                {p.illustration.image && <img src={p.illustration.image.url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex items-center justify-between px-1.5 py-1 text-[11px]">
                <span>{p.pageNumber}</span>
                {p.illustration.status === "rendering" && <Loader2 className="h-3 w-3 animate-spin" />}
                {p.illustration.status === "error" && <AlertTriangle className="h-3 w-3 text-destructive" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <PageEditorPanel pageNumber={selected} />
      </aside>
    </div>
  );
}
