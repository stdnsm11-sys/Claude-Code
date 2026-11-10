# StoryStage: animated social stories

Type a situation, choose an animation style, and Claude writes a social story that plays as an animated, narrated picture book.

## Two ways to run it

**1. On claude.ai (no setup).** Open the published artifact. *Write story with Claude* uses your own Claude account. The first time, Claude asks you to allow it.

**2. Locally with the Claude API.**

```bash
cd social-story-studio
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # or run `ant auth login` once
npm start                             # http://localhost:5173
```

`server.mjs` serves the page and calls Claude, so your API key stays on the server. Settings:
- `STORY_MODEL`: the model to use (default `claude-opus-5-5`)
- `PORT`: the port (default 5173)

If you open `index.html` straight from disk, Claude isn't connected, and the app falls back to a fixed template story.

## How story generation works

The page sends the situation, student name, grade band, page count, sentences per page and chosen style. Claude follows Carol Gray's social-story guidance: first person, mostly descriptive and perspective sentences, gentle directive sentences, and an affirmative ending. Claude returns structured JSON:

```json
{ "title": "...", "character": "...",
  "pages": [{ "text": "...", "type": "descriptive|perspective|directive|affirmative",
              "setting": "classroom|hallway|outside|cafeteria|home",
              "prop": "clock|bell|line|ears|door|star|heart|tray|swing|scissors",
              "emotion": "calm|worried|happy", "scene": "..." }] }
```

The local server uses structured outputs (`output_config.format`) so the JSON always matches this schema. If a safety classifier declines a request, it is retried on Anthropic's recommended fallback model (`fallbacks: "default"`).

## The 20 studio styles

| # | Style | What the renderer draws |
|---|---|---|
| 1 | Pixar 3D Modern | Soft shading, big glossy eyes, bokeh, warm glow, bouncy motion |
| 2 | Studio Ghibli Watercolor | Painted rolling hills and clouds, wobbly watercolor edges, paper grain |
| 3 | 1930s Rubber Hose | Sepia, pie-cut eyes, noodle limbs with white gloves, film grain and scratches, squash motion |
| 4 | 90s Cel-Shaded Anime | Neon city at night, hard cel shadows, scanlines, film grain |
| 5 | Claymation (Aardman) | Plasticine colors, thumbprints, warm light, stuttering stop-motion |
| 6 | Stop-Motion Puppet (LAIKA) | Misty crooked forest, stitched outlines, burlap texture, dramatic side light |
| 7 | Vector Flat Motion | Flat color blocks, dot eyes, no shadows |
| 8 | Spider-Verse Comic 3D | Halftone dots, color misregistration, impact bursts, speed lines, motion on twos |
| 9 | Cyberpunk Neon Noir | Rain, fog, neon glow, wet-floor reflections, HUD overlay |
| 10 | Chibi Kawaii | Oversized head, tiny body, sparkle eyes, pastel hearts |
| 11 | 16-Bit Pixel Art | Pixel sprites, pixel pine forest, dithering |
| 12 | Rotoscoped Trace | Rippling outlines, brush strokes, shifting colors |
| 13 | Sumi-e Ink Wash | Ink mountains, brush-stroke ground, rice paper, red seal |
| 14 | Ukiyo-e Woodblock | Indigo waves, red sun, black outlines, paper grain |
| 15 | Paper Cut-Out Craft | Layered paper hills, drop shadows, paper texture |
| 16 | Goth-Baroque Dark Fantasy | Spindly character, sunken eyes, curly trees, moonlight |
| 17 | Mid-Century UPA | Fills offset from line art, mustard and teal shapes |
| 18 | PS1 Low-Poly 3D | Faceted polygons, dithering, vertex jitter |
| 19 | Oil Painting Impasto | Swirling sky, glowing halo, canvas weave |
| 20 | Hyper-Real Cinematic CGI | Depth-of-field blur, bokeh, vignette, soft highlights |

Each style also stores its traits and a sample image prompt. The player's *Style notes and image prompt* panel joins that prompt with Claude's scene and character notes, ready to send to an image model. Sixteen more styles (Manga, Chalkboard, Calm Pastel, and others) are under the *All* filter.

## Extending
- **Add a style:** add one `S(...)` entry to `STUDIO` or `MORE` in `index.html`.
- **New settings or props:** add them to `ENUMS` in both `index.html` and `server.mjs`, and draw them in `scene()` / `propSvg()`.
- **Export / Share / My stories** buttons only show a message for now.
