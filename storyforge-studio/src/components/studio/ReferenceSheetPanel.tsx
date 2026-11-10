"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, PencilLine, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateReference } from "@/lib/client/api";
import { useBookStore } from "@/store/useBookStore";

/**
 * Stage 2a UI: generate the Character Reference Turnaround Sheet, let the user
 * regenerate (new seed or edited prompt) until happy, then approve it.
 */
export function ReferenceSheetPanel({ onApprove }: { onApprove: () => void }) {
  const book = useBookStore((s) => s.book);
  const update = useBookStore((s) => s.update);
  const applyReferenceImage = useBookStore((s) => s.applyReferenceImage);
  const [editing, setEditing] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const autoStarted = useRef(false);

  const reference = book?.reference;
  const busy = reference?.status === "rendering";

  async function run(opts: { seed?: number } = {}) {
    if (!useBookStore.getState().book) return;
    update((b) => ({ ...b, reference: { ...b.reference, status: "rendering", error: undefined } }));
    try {
      const { image } = await generateReference(useBookStore.getState().book!, opts);
      applyReferenceImage(image);
    } catch (err) {
      update((b) => ({
        ...b,
        reference: { ...b.reference, status: "error", error: err instanceof Error ? err.message : String(err) },
      }));
    }
  }

  // Kick off the first reference render automatically.
  useEffect(() => {
    if (!autoStarted.current && reference && reference.status === "idle" && !reference.image) {
      autoStarted.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference?.status]);

  if (!book || !reference) return null;
  const promptValue = reference.promptOverride ?? book.bible.turnaroundPrompt;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Character reference sheet</CardTitle>
        <CardDescription>
          Every page is conditioned on this turnaround, so the cast stays on-model across the whole book. Regenerate
          until it looks right, then approve.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative flex aspect-[1344/768] items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {reference.image && (
            <img
              src={reference.image.url}
              alt="Character reference turnaround sheet"
              className={`h-full w-full object-contain transition-opacity ${busy ? "opacity-40" : ""}`}
            />
          )}
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              Painting the turnaround sheet…
            </div>
          )}
          {!busy && !reference.image && reference.status !== "error" && (
            <span className="text-sm text-muted-foreground">No reference yet</span>
          )}
        </div>

        {reference.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{reference.error}</p>}

        {reference.history && reference.history.length > 0 && (
          <div className="space-y-1">
            <Label>Previous versions (click to restore)</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {reference.history.map((h) => (
                <button
                  key={h.url}
                  type="button"
                  onClick={() => applyReferenceImage(h)}
                  className="h-16 shrink-0 overflow-hidden rounded border hover:ring-2 hover:ring-primary"
                  title={`Seed ${h.seed}`}
                >
                  <img src={h.url} alt={`Previous reference, seed ${h.seed}`} className="h-full" />
                </button>
              ))}
            </div>
          </div>
        )}

        {editing && (
          <div className="space-y-2 rounded-lg border p-3">
            <Label htmlFor="ref-prompt">Turnaround prompt</Label>
            <Textarea
              id="ref-prompt"
              value={promptValue}
              onChange={(e) => update((b) => ({ ...b, reference: { ...b.reference, promptOverride: e.target.value } }))}
              className="min-h-28 text-sm"
            />
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="ref-seed">Seed (blank = random)</Label>
                <Input
                  id="ref-seed"
                  inputMode="numeric"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value.replace(/\D/g, ""))}
                  className="w-40"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update((b) => ({ ...b, reference: { ...b.reference, promptOverride: undefined } }))}
              >
                Reset prompt
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => run({ seed: seed ? Number(seed) : undefined })} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Regenerate
          </Button>
          <Button variant="ghost" onClick={() => setEditing((v) => !v)}>
            <PencilLine />
            {editing ? "Hide prompt" : "Tweak prompt / seed"}
          </Button>
          <div className="flex-1" />
          {reference.image && (
            <span className="text-xs text-muted-foreground">
              seed {reference.image.seed} · {reference.image.provider}
            </span>
          )}
          <Button onClick={onApprove} disabled={busy || !reference.image}>
            <CheckCircle2 />
            Approve & illustrate {book.pages.length} pages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
