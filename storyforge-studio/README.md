# StoryForge Studio

Generate a custom, fully illustrated storybook (4–20 pages) from a single prompt, with the same characters on every page.

```
premise ─▶ Stage 1: Story Director (Claude, structured output)
            ├─ Character Bible (≤3 characters, exact visual descriptors + consistency tokens)
            ├─ Turnaround-sheet prompt
            └─ Page plan: storyText · sceneCompositionPrompt · charactersPresent · shot · mood
        ─▶ Stage 2a: Character Reference Turnaround Sheet ─▶ user approves / regenerates
        ─▶ Stage 2b: page queue (p-limit, retries, SSE progress)
                 style preset + bible tokens + scene prompt + reference image (IP-Adapter)
        ─▶ Flipbook editor (edit text, tweak prompt/seed, regenerate one page) ─▶ PDF
```

## Quick start

```bash
cd storyforge-studio
npm install
cp .env.example .env.local   # optional: add keys to go live
npm run dev                  # http://localhost:3000
```

With no keys set, the app runs in **Demo mode**: a deterministic mock Story Director and an SVG mock renderer
exercise the whole flow (queue, progress streaming, regenerate, flipbook, PDF) without spending credits.
You can also switch Demo mode on per book from the home screen while keys are configured.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Stage 1 Story Director (`claude-opus-5-5` by default, override with `ANTHROPIC_MODEL`) |
| `IMAGE_PROVIDER` | `fal` (default), `replicate` or `mock` |
| `FAL_KEY` | fal.ai key for `fal-ai/flux-general` |
| `REPLICATE_API_TOKEN` | Replicate token for `black-forest-labs/flux-1.1-pro` |
| `RENDER_CONCURRENCY` / `RENDER_MAX_ATTEMPTS` | Queue tuning (default 3 / 3) |
| `STORYFORGE_DEMO_MODE` | `true` forces mock providers for every request |

See `.env.example` for the Fal/Replicate tuning knobs (IP-Adapter weights path, NAG scale, reference-only strength).

## Project layout

```
src/
├── app/
│   ├── page.tsx                       Story configuration + drafts
│   ├── studio/[bookId]/page.tsx       Cast & reference → Illustrate → Read & edit
│   └── api/
│       ├── story/route.ts             Stage 1 (Claude structured output)
│       ├── character-sheet/route.ts   Stage 2a turnaround sheet
│       ├── render/route.ts            Stage 2b queue, Server-Sent Events
│       ├── page/route.ts              Regenerate one page
│       ├── image-proxy/route.ts       Allowlisted proxy so PDF export can read provider images
│       └── status/route.ts            Which providers are live
├── config/
│   ├── animationStyles.ts             Style prompt-engineering matrix
│   ├── ageGroups.ts                   Reading-level guidance, page-count bounds
│   └── imageModels.ts                 Model ids, sizes, IP-Adapter / queue settings
├── lib/
│   ├── llm/                           Story Director prompts, Zod schema, Anthropic call
│   ├── image/                         ImageProvider adapters: fal.ts, replicate.ts, mock.ts, factory
│   ├── prompt/composePrompt.ts        style + bible + scene → final prompt/negative
│   ├── queue/renderQueue.ts           concurrency-limited retrying queue
│   ├── storage/                       BookRepository: IndexedDB (idb) + Supabase stub
│   ├── pdf/exportPdf.ts               jsPDF exporter (print A4 / tablet 4:3)
│   └── client/api.ts                  Browser API client incl. SSE reader
├── store/useBookStore.ts              zustand store with debounced autosave
└── components/                        config/, studio/, book/ (flipbook, page editor), export/, ui/ (shadcn)
```

## Character consistency

1. **Bible tokens.** Claude writes a compact `consistencyTokens` string per character. It is pasted verbatim into
   every page prompt for the characters present, while `sceneCompositionPrompt` describes only what is new on that page.
   You can edit the tokens before rendering.
2. **Reference sheet.** The approved turnaround is passed to every page render. On Fal it goes into `ip_adapters`
   (XLabs FLUX IP-Adapter, weight from the style's `referenceScale`); `FAL_REFERENCE_STRENGTH` can stack reference-only
   guidance on top. On Replicate it goes into `image_prompt` (Redux), which holds characters less tightly.
3. **Seeds.** Pages derive stable seeds from the reference seed, so a re-run reproduces the book. Any page can lock or
   randomise its own seed.

## Swapping image providers

Every backend implements `ImageProvider` (`src/lib/image/types.ts`). `createImageProvider()` in
`src/lib/image/index.ts` is the only place that knows the concrete classes, and `IMAGE_PROVIDER` picks one at runtime.

| | fal-ai/flux-general | flux-1.1-pro (Replicate) |
| --- | --- | --- |
| Reference image | IP-Adapter (+ optional reference-only) | `image_prompt` |
| Negative prompt | yes (NAG) | ignored |
| LoRAs from style matrix | yes | ignored |

## Style matrix

`src/config/animationStyles.ts` maps each style to a positive prefix/suffix (medium, lens, lighting, texture), a
negative prompt (merged with a global list that blocks text, watermarks and anatomy failures), optional LoRAs
(`{ path, scale, triggerWord }`), guidance, steps, reference weight, and the palette and typography used by the
UI, the mock renderer and the PDF.

## Storage and Supabase

Drafts live in IndexedDB through the `BookRepository` interface. `src/lib/storage/supabase.ts` implements the same
interface against a `books` table (schema and RLS policy in the file header). To enable it, install
`@supabase/supabase-js` and return it from `getBookRepository()`.

## Known limitations

- Provider image URLs are stored as-is. fal and Replicate CDN links can expire, so copy images into your own storage
  (for example a Supabase bucket) before relying on old drafts.
- The fal adapter was written against the typed `fal-ai/flux-general` schema in `@fal-ai/client` but has not been run
  against the live API from this repository's CI. Check IP-Adapter strength per style on a first real book.
- `@fal-ai/client` is used instead of the deprecated `@fal-ai/serverless-client`.
- The PDF uses jsPDF's built-in fonts, so emoji and non-Latin scripts in story text won't render.
