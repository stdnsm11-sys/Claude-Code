"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AGE_GROUP_LIST, PAGE_COUNT } from "@/config/ageGroups";
import { createBookFromPlan } from "@/lib/book/factory";
import { createStoryPlan, type ProviderStatus } from "@/lib/client/api";
import { getBookRepository } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AgeGroupId, AnimationStyleId } from "@/types/book";
import { StyleGallery } from "./StyleGallery";

const EXAMPLES = [
  "A shy lighthouse keeper's daughter befriends a whale who is afraid of storms.",
  "Two robot siblings run a tiny bakery on the moon and must make a cake for a comet.",
  "A grandmother tortoise teaches her impatient grandson to win a race by noticing things.",
];

export function StoryConfigForm({ status }: { status: ProviderStatus | null }) {
  const router = useRouter();
  const [premise, setPremise] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroupId>("early-reader");
  const [pageCount, setPageCount] = useState<number>(PAGE_COUNT.default);
  const [styleId, setStyleId] = useState<AnimationStyleId>("miyazaki-watercolor");
  const [demoMode, setDemoMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveAvailable = status ? status.llm !== "mock" || status.image !== "mock" : true;
  const effectiveDemo = demoMode || !liveAvailable;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const config = { premise, ageGroup, pageCount, styleId, demoMode: effectiveDemo };
      const { plan } = await createStoryPlan(config);
      const book = createBookFromPlan(plan, config);
      await getBookRepository().save(book);
      router.push(`/studio/${book.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">What&apos;s the story?</CardTitle>
          <CardDescription>One premise is enough. The Story Director writes the pages and designs the cast.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            placeholder="A curious fox kit who is afraid of the dark finds a lantern that leads to..."
            className="min-h-28 font-serif text-base"
            required
            minLength={10}
            maxLength={2000}
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPremise(ex)}
                className="rounded-full border bg-secondary px-3 py-1 text-xs text-secondary-foreground hover:bg-accent"
              >
                {ex.slice(0, 48)}…
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reader age</CardTitle>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Target age group" className="grid grid-cols-3 gap-2">
              {AGE_GROUP_LIST.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={ageGroup === g.id}
                  onClick={() => setAgeGroup(g.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                    ageGroup === g.id && "border-primary bg-primary/10 ring-1 ring-primary",
                  )}
                >
                  <div className="text-sm font-semibold">{g.label}</div>
                  <div className="text-xs text-muted-foreground">Ages {g.ages}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between">
              <span>Pages</span>
              <span className="font-serif text-3xl text-primary">{pageCount}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Slider
              min={PAGE_COUNT.min}
              max={PAGE_COUNT.max}
              step={1}
              value={[pageCount]}
              onValueChange={([v]) => setPageCount(v)}
              aria-label="Page count"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{PAGE_COUNT.min}</span>
              <span>{PAGE_COUNT.max}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Animation style</CardTitle>
          <CardDescription>Every page and the character reference sheet are rendered in this look.</CardDescription>
        </CardHeader>
        <CardContent>
          <StyleGallery value={styleId} onChange={setStyleId} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Switch
            id="demo"
            checked={effectiveDemo}
            disabled={!liveAvailable}
            onCheckedChange={setDemoMode}
          />
          <div>
            <Label htmlFor="demo">Demo mode</Label>
            <p className="text-xs text-muted-foreground">
              {liveAvailable
                ? "Uses placeholder story and art. No API credits are spent."
                : "No API keys are configured, so demo mode is required. Add keys in .env.local to go live."}
            </p>
          </div>
        </div>
        <Button type="submit" size="lg" disabled={busy || premise.trim().length < 10}>
          {busy ? <Loader2 className="animate-spin" /> : effectiveDemo ? <Sparkles /> : <Wand2 />}
          {busy ? "Writing the story & designing the cast…" : "Create storybook"}
        </Button>
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    </form>
  );
}
