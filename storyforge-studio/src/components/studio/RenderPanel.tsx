"use client";

import { AlertTriangle, BookOpen, CheckCircle2, Loader2, RotateCcw, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBookStore } from "@/store/useBookStore";
import type { StoryPage } from "@/types/book";

function PageTile({ page }: { page: StoryPage }) {
  const { status, image, error } = page.illustration;
  return (
    <div className="overflow-hidden rounded-lg border bg-card text-xs">
      <div className="relative aspect-[4/3] bg-muted">
        {image && <img src={image.url} alt={`Page ${page.pageNumber}`} className="h-full w-full object-cover" />}
        {(status === "rendering" || status === "queued") && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            {status === "rendering" ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <span className="text-muted-foreground">queued</span>
            )}
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 p-2">
        <span className="font-medium">Page {page.pageNumber}</span>
        {status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
      </div>
      {error && <p className="line-clamp-2 px-2 pb-2 text-destructive" title={error}>{error}</p>}
    </div>
  );
}

export function RenderPanel({ onStart, onCancel }: { onStart: (pages?: number[]) => void; onCancel: () => void }) {
  const book = useBookStore((s) => s.book);
  const render = useBookStore((s) => s.render);
  const update = useBookStore((s) => s.update);
  if (!book) return null;

  const done = book.pages.filter((p) => p.illustration.status === "done").length;
  const failedPages = book.pages.filter((p) => p.illustration.status === "error").map((p) => p.pageNumber);
  const pct = render.running && render.total ? ((render.completed + render.failed) / render.total) * 100 : (done / book.pages.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Illustrating your book</CardTitle>
        <CardDescription>
          Each page combines the style preset, the Character Bible and the scene prompt, and is conditioned on the
          approved reference sheet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {done} / {book.pages.length} pages illustrated
              {render.running && render.failed > 0 && `, ${render.failed} failed`}
            </span>
            <span className="flex flex-wrap gap-1">
              {render.provider && <Badge variant="outline">{render.provider === "mock" ? "mock renderer" : render.model}</Badge>}
              {render.concurrency && <Badge variant="outline">{render.concurrency} at a time</Badge>}
            </span>
          </div>
          <Progress value={pct} />
        </div>

        {render.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{render.error}</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {book.pages.map((p) => (
            <PageTile key={p.pageNumber} page={p} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {render.running ? (
            <Button variant="outline" onClick={onCancel}>
              <Square />
              Stop
            </Button>
          ) : (
            <>
              {done < book.pages.length && (
                <Button onClick={() => onStart()}>
                  <RotateCcw />
                  {failedPages.length ? `Retry ${book.pages.length - done} remaining` : "Resume rendering"}
                </Button>
              )}
              <Button variant={done === book.pages.length ? "default" : "outline"} onClick={() => update((b) => ({ ...b, stage: "editing" }))}>
                <BookOpen />
                Open the book
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
