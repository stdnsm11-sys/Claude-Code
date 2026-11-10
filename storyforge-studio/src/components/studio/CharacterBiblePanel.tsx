"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBookStore } from "@/store/useBookStore";

/** Shows (and lets the user refine) the Stage 1 Character Bible. */
export function CharacterBiblePanel({ readOnly }: { readOnly?: boolean }) {
  const bible = useBookStore((s) => s.book?.bible);
  const update = useBookStore((s) => s.update);
  if (!bible) return null;

  const setTokens = (id: string, consistencyTokens: string) =>
    update((b) => ({
      ...b,
      bible: { ...b.bible, characters: b.bible.characters.map((c) => (c.id === id ? { ...c, consistencyTokens } : c)) },
    }));

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-xl">Character Bible</h2>
      {bible.characters.map((c) => (
        <Card key={c.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2">
              {c.name}
              <Badge variant="secondary">{c.role}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {c.species}, {c.ageDescriptor}. {c.personality}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">Build</dt>
              <dd>{c.proportions}</dd>
              <dt className="text-muted-foreground">Skin/fur</dt>
              <dd>{c.skinOrFur}</dd>
              <dt className="text-muted-foreground">Hair</dt>
              <dd>{c.hair}</dd>
              <dt className="text-muted-foreground">Eyes</dt>
              <dd>{c.eyes}</dd>
              <dt className="text-muted-foreground">Outfit</dt>
              <dd>{c.outfit}</dd>
              {c.accessories.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Accessories</dt>
                  <dd>{c.accessories.join(", ")}</dd>
                </>
              )}
              {c.distinguishingFeatures.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Marks</dt>
                  <dd>{c.distinguishingFeatures.join(", ")}</dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap gap-1">
              {c.colorPalette.map((col) => (
                <Badge key={col} variant="outline">
                  {col}
                </Badge>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor={`tokens-${c.id}`}>Consistency tokens (injected into every page prompt)</Label>
              <Textarea
                id={`tokens-${c.id}`}
                value={c.consistencyTokens}
                onChange={(e) => setTokens(c.id, e.target.value)}
                readOnly={readOnly}
                className="min-h-20 font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      ))}
      {bible.worldNotes && (
        <p className="rounded-lg border bg-secondary/50 p-3 text-sm">
          <span className="font-semibold">World notes: </span>
          {bible.worldNotes}
        </p>
      )}
    </div>
  );
}
