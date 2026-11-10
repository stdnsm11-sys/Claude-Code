# StoryStage: animated social stories (mockup)

Open `index.html` in a browser. It is a single file with no build step.

## What works in the mockup
- **Prompt → story**: type a situation and press *Generate story*. A template stands in for the AI step (`mockGenerate` in the script).
- **27 animation styles**: Manga, Soft 3D, Abstract, Watercolor, Claymation, Paper Cutout, Pixel Art, Comic Book, Chalkboard, Storybook Ink, Chibi Anime, Flat Vector, Crayon, Stained Glass, Neon Glow, Origami, Low Poly, Pop Art, Blueprint, Felt & Fabric, Silhouette, Retro 70s, Pencil Sketch, Calm Pastel, Woodblock Print, Outer Space, Quiet Night.
- **Player**: play/pause with auto-advance, pace slider, read-aloud (browser speech), arrow keys, filmstrip, add page, editable page text.
- **Social-story supports**: sentence-type tags (descriptive / perspective / directive / affirmative), calm-motion mode, grade band, text length.

## How to extend
- **Add a style**: add one `S(...)` entry to `STYLES`. A style is data (colors, outline, character shape, filter, overlays, motion, caption font).
- **Real generation**: replace `mockGenerate` with a model call that returns
  `{ title, pages: [{ text, type, setting, prop, emotion }] }`.
  Settings: classroom, hallway, outside, cafeteria, home. Props: clock, bell, line, ears, door, star, heart, tray, swing, scissors.
- **Export / Share / My stories** buttons only show a message for now.
