"use client";

import { Check } from "lucide-react";
import { ANIMATION_STYLE_LIST } from "@/config/animationStyles";
import { cn } from "@/lib/utils";
import type { AnimationStyleId } from "@/types/book";
import { StylePreview } from "./StylePreview";

export function StyleGallery({ value, onChange }: { value: AnimationStyleId; onChange: (id: AnimationStyleId) => void }) {
  return (
    <div role="radiogroup" aria-label="Animation style" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ANIMATION_STYLE_LIST.map((style) => {
        const selected = style.id === value;
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(style.id)}
            className={cn(
              "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-primary ring-2 ring-primary",
            )}
          >
            <StylePreview style={style} />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{style.label}</div>
                <div className="text-xs text-muted-foreground">{style.tagline}</div>
              </div>
              {selected && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
