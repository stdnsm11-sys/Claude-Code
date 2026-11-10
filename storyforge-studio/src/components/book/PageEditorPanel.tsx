"use client";

import { useState } from "react";
import { ChevronDown, Dice5, Loader2, Lock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { regeneratePage } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { useBookStore } from "@/store/useBookStore";

/**
 * Per-page editor: story text, the visual prompt, cast, seed, and a
 * "Regenerate Illustration" action that re-renders only this page.
 */
export function PageEditorPanel({ pageNumber }: { pageNumber: number }) {
  const book = useBookStore((s) => s.book);
  const updatePage = useBookStore((s) => s.updatePage);
  const setPageIllustration = useBookStore((s) => s.setPageIllustration);
  const applyPageImage = useBookStore((s) => s.applyPageImage);
  const [showPrompt, setShowPrompt] = useState(false);

  const page = book?.pages.find((p) => p.pageNumber === pageNumber);
  if (!book || !page) return null;
  const busy = page.illustration.status === "rendering";

  async function regenerate() {
    const current = useBookStore.getState().book;
    const p = current?.pages.find((x) => x.pageNumber === pageNumber);
    if (!current || !p) return;
    setPageIllustration(pageNumber, { status: "rendering", error: undefined });
    try {
      const { image } = await regeneratePage(current, p, p.seedOverride);
      applyPageImage(pageNumber, image);
    } catch (err) {
      setPageIllustration(pageNumber, {
        status: p.illustration.image ? "done" : "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const toggleCharacter = (id: string) =>
    updatePage(pageNumber, {
      charactersPresent: page.charactersPresent.includes(id)
        ? page.charactersPresent.filter((c) => c !== id)
        : [...page.charactersPresent, id],
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg">Page {pageNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="story-text">Story text</Label>
          <Textarea
            id="story-text"
            value={page.storyText}
            onChange={(e) => updatePage(pageNumber, { storyText: e.target.value })}
            className="min-h-28 font-serif text-base"
          />
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="text-sm font-semibold">Illustration</div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
            {page.illustration.image && (
              <img
                src={page.illustration.image.url}
                alt={`Page ${pageNumber} illustration`}
                className={cn("h-full w-full object-cover", busy && "opacity-40")}
              />
            )}
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          {page.illustration.error && <p className="text-xs text-destructive">{page.illustration.error}</p>}

          <div className="space-y-1">
            <Label htmlFor="scene">Scene composition prompt</Label>
            <Textarea
              id="scene"
              value={page.sceneCompositionPrompt}
              onChange={(e) => updatePage(pageNumber, { sceneCompositionPrompt: e.target.value })}
              className="min-h-24 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="shot">Shot</Label>
              <Input id="shot" value={page.shotType} onChange={(e) => updatePage(pageNumber, { shotType: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mood">Mood</Label>
              <Input id="mood" value={page.mood} onChange={(e) => updatePage(pageNumber, { mood: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Characters on this page</Label>
            <div className="flex flex-wrap gap-1">
              {book.bible.characters.map((c) => {
                const on = page.charactersPresent.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleCharacter(c.id)} aria-pressed={on}>
                    <Badge variant={on ? "default" : "outline"}>{c.name}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="seed">Seed</Label>
              <Input
                id="seed"
                inputMode="numeric"
                placeholder="random each time"
                value={page.seedOverride ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  updatePage(pageNumber, { seedOverride: v ? Number(v) : undefined });
                }}
              />
            </div>
            {page.illustration.image && (
              <Button
                variant="outline"
                size="icon"
                title="Lock the current image's seed"
                aria-label="Lock current seed"
                onClick={() => updatePage(pageNumber, { seedOverride: page.illustration.image!.seed })}
              >
                <Lock />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              title="Clear seed (random)"
              aria-label="Use a random seed"
              onClick={() => updatePage(pageNumber, { seedOverride: undefined })}
            >
              <Dice5 />
            </Button>
          </div>
          <Button className="w-full" onClick={regenerate} disabled={busy || !book.reference.image}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Regenerate illustration
          </Button>

          {page.illustration.history && page.illustration.history.length > 0 && (
            <div className="space-y-1">
              <Label>Previous versions (click to restore)</Label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {page.illustration.history.map((h) => (
                  <button
                    key={h.url}
                    type="button"
                    onClick={() => applyPageImage(pageNumber, h)}
                    className="h-14 shrink-0 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
                    title={`Seed ${h.seed}`}
                  >
                    <img src={h.url} alt={`Earlier version, seed ${h.seed}`} className="h-full" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {page.illustration.image && (
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowPrompt((v) => !v)}
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", showPrompt && "rotate-180")} />
                Final prompt sent to {page.illustration.image.provider} (seed {page.illustration.image.seed})
              </button>
              {showPrompt && (
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-[11px] leading-snug">
                  {page.illustration.image.prompt}
                  {"\n\nNEGATIVE: "}
                  {page.illustration.image.negativePrompt}
                </pre>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
