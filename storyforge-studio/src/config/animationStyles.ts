import type { AnimationStyleId } from "@/types/book";

/**
 * Style Prompt Engineering Matrix
 * --------------------------------
 * Each user-facing animation style maps to:
 *  - positive prompt prefix/suffix (medium, lighting, lens, texture)
 *  - a negative prompt (photorealism, anatomy failures, stray text)
 *  - optional LoRA weights for Fal.ai / Replicate
 *  - generation defaults (guidance, steps, how hard the character reference is applied)
 *
 * `prefix` goes before the scene so the model locks in the medium first;
 * `suffix` carries finishing notes (grain, grading) that matter less than subject.
 *
 * LoRA URLs are left empty by default: drop in any FLUX-compatible
 * .safetensors URL (Hugging Face, Civitai, or a fal-trained LoRA) and it is
 * forwarded by the Fal adapter automatically.
 */

export interface LoraConfig {
  /** URL or HF repo path of FLUX LoRA weights (.safetensors). */
  path: string;
  /** Typical useful range 0.4 – 1.2. */
  scale: number;
  /** Optional trigger word prepended to the prompt when this LoRA is active. */
  triggerWord?: string;
}

export interface AnimationStyle {
  id: AnimationStyleId;
  label: string;
  tagline: string;
  description: string;
  prompt: {
    prefix: string;
    suffix: string;
    negative: string;
    /** Extra notes appended only to the character turnaround sheet. */
    turnaroundNotes: string;
  };
  loras: LoraConfig[];
  generation: {
    guidanceScale: number;
    numInferenceSteps: number;
    /** IP-Adapter weight for the character reference (0 = ignore, 1 = clone). */
    referenceScale: number;
  };
  /** UI swatch + mock/demo renderer palette (hex). */
  palette: {
    sky: [string, string];
    ground: string;
    accent: string;
    ink: string;
  };
  /** Typography pairing used by the flipbook + PDF. */
  typography: {
    fontFamily: string;
    pdfFont: "times" | "helvetica" | "courier";
  };
}

/** Appended to every style's negative prompt. */
export const GLOBAL_NEGATIVE_PROMPT = [
  "text",
  "letters",
  "words",
  "captions",
  "watermark",
  "signature",
  "logo",
  "speech bubbles",
  "deformed hands",
  "extra fingers",
  "missing fingers",
  "fused fingers",
  "extra limbs",
  "malformed anatomy",
  "duplicate characters",
  "cropped head",
  "blurry",
  "jpeg artifacts",
  "low quality",
  "nsfw",
  "gore",
].join(", ");

export const ANIMATION_STYLES: Record<AnimationStyleId, AnimationStyle> = {
  "miyazaki-watercolor": {
    id: "miyazaki-watercolor",
    label: "Hand-Painted Miyazaki",
    tagline: "Watercolour skies, warm cel-shaded heroes",
    description:
      "Lush gouache and watercolour backgrounds, soft cumulus clouds and warm cel-shaded characters in the Studio Ghibli tradition.",
    prompt: {
      prefix:
        "hand-painted anime film still, Studio Ghibli inspired, lush watercolor and gouache background painting, warm cel-shaded characters with clean soft linework",
      suffix:
        "soft natural sunlight, gentle atmospheric perspective, towering cumulus clouds, painterly foliage detail, nostalgic warm color grading, 35mm film framing, subtle paper texture",
      negative:
        "photorealistic, 3d render, cgi, plastic, glossy, harsh neon, hyper-detailed skin pores, western comic style, heavy outlines, oversaturated",
      turnaroundNotes:
        "flat cel shading on characters, minimal background, consistent line weight, anime model sheet",
    },
    loras: [],
    generation: { guidanceScale: 3.5, numInferenceSteps: 28, referenceScale: 0.65 },
    palette: { sky: ["#9fd3e8", "#f4e9c9"], ground: "#7aa95c", accent: "#e8a33d", ink: "#3b3a36" },
    typography: { fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif", pdfFont: "times" },
  },
  "3d-feature": {
    id: "3d-feature",
    label: "3D Feature Animation",
    tagline: "Pixar-grade lighting and depth",
    description:
      "Stylised 3D characters with subsurface scattering, expressive rim lighting and cinematic depth of field.",
    prompt: {
      prefix:
        "3D animated feature film still, stylized CG characters, Pixar and DreamWorks inspired, appealing exaggerated proportions, subsurface scattering skin, soft fur and cloth simulation",
      suffix:
        "cinematic three-point lighting, warm key light with cool rim light, volumetric god rays, shallow depth of field, 50mm anamorphic lens, global illumination, rich color script, octane-quality render",
      negative:
        "2d, flat, sketch, anime, photorealistic human, uncanny valley, realistic skin texture, low poly, ps2 graphics, dead eyes, stiff pose",
      turnaroundNotes:
        "neutral studio lighting, grey seamless backdrop, A-pose and relaxed poses, turntable character sheet",
    },
    loras: [],
    generation: { guidanceScale: 3.5, numInferenceSteps: 30, referenceScale: 0.7 },
    palette: { sky: ["#5aa7ff", "#ffd59e"], ground: "#5cb85c", accent: "#ff7a45", ink: "#1f2a44" },
    typography: { fontFamily: "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", pdfFont: "helvetica" },
  },
  "golden-age-cel": {
    id: "golden-age-cel",
    label: "Golden Age 2D Cel",
    tagline: "1990s Renaissance ink & paint",
    description:
      "Hand-drawn ink-and-paint animation with textured paper grain, painted multiplane backgrounds and dramatic theatrical lighting.",
    prompt: {
      prefix:
        "1990s hand-drawn 2D animated feature film still, traditional ink and paint cel animation, Disney Renaissance inspired, expressive confident clean-up linework",
      suffix:
        "lush painted multiplane background, dramatic theatrical lighting, rich saturated jewel tones, visible textured paper grain, subtle film grain, painted highlights and cast shadows",
      negative:
        "3d render, cgi, photorealistic, vector flat, anime, digital airbrush, thin wobbly lines, modern flash animation",
      turnaroundNotes:
        "classic animation model sheet, construction-clean lines, pencil-tested poses, off-white animation paper",
    },
    loras: [],
    generation: { guidanceScale: 3.8, numInferenceSteps: 28, referenceScale: 0.65 },
    palette: { sky: ["#3a4f9c", "#f5b971"], ground: "#4f7f4a", accent: "#d4483b", ink: "#2b1d14" },
    typography: { fontFamily: "'Baskerville', 'Libre Baskerville', 'Times New Roman', serif", pdfFont: "times" },
  },
  "stop-motion": {
    id: "stop-motion",
    label: "Tactile Stop-Motion",
    tagline: "Felt, clay and miniature sets",
    description:
      "Laika / Aardman style handcrafted puppets with felt, clay and knitted textures shot on miniature sets with a macro lens.",
    prompt: {
      prefix:
        "stop-motion animation film still, handcrafted miniature puppet characters, Laika and Aardman inspired, sculpted plasticine clay and felt textures, visible fingerprints and stitching",
      suffix:
        "detailed miniature set with handmade props, practical studio lighting, shallow macro depth of field, 100mm macro lens, tilt-shift miniature feel, soft bokeh, tactile fabric and wood textures",
      negative:
        "2d, drawing, anime, smooth cgi, glossy plastic toy, photorealistic human, digital painting, cel shading",
      turnaroundNotes:
        "puppet character sheet on a felt-covered turntable, armature-ready poses, even softbox lighting",
    },
    loras: [],
    generation: { guidanceScale: 3.5, numInferenceSteps: 30, referenceScale: 0.72 },
    palette: { sky: ["#c9b8a3", "#f2e2c4"], ground: "#8d6e4f", accent: "#c0504d", ink: "#3a2e25" },
    typography: { fontFamily: "'Rockwell', 'Courier New', 'American Typewriter', serif", pdfFont: "courier" },
  },
  "vector-folklore": {
    id: "vector-folklore",
    label: "Modern Vector Flat-Art",
    tagline: "Folklore geometry, bold linework",
    description:
      "Cartoon Saloon / Wolfwalkers-inspired geometric folklore art: bold variable linework, flat decorative shapes and woodcut textures.",
    prompt: {
      prefix:
        "2D animated film still, Cartoon Saloon and Wolfwalkers inspired, geometric folklore illustration, bold variable-weight linework, flat decorative shapes, Celtic knotwork motifs",
      suffix:
        "limited harmonious palette, layered flat planes with subtle woodcut and pencil texture, stylized circular forest forms, graphic composition, storybook framing",
      negative:
        "3d render, photorealistic, soft airbrush gradients, anime, realistic proportions, cluttered detail, lens flare",
      turnaroundNotes:
        "flat graphic model sheet, consistent geometric construction shapes, solid colour fills",
    },
    loras: [],
    generation: { guidanceScale: 4.0, numInferenceSteps: 28, referenceScale: 0.6 },
    palette: { sky: ["#264653", "#e9c46a"], ground: "#2a9d8f", accent: "#e76f51", ink: "#14213d" },
    typography: { fontFamily: "'Gill Sans', 'Gill Sans MT', 'Trebuchet MS', sans-serif", pdfFont: "helvetica" },
  },
  "saturday-morning": {
    id: "saturday-morning",
    label: "Saturday Morning Retro",
    tagline: "80s/90s cel, bold outlines, halftone",
    description:
      "Retro TV cel animation: thick black outlines, flat bright colours, halftone shading and a touch of VHS warmth.",
    prompt: {
      prefix:
        "1980s and 1990s Saturday morning cartoon cel animation still, thick bold black outlines, flat bright primary colors, retro TV animation",
      suffix:
        "halftone dot shading, simple painted backgrounds, punchy contrast, slight VHS color bleed, 4:3 TV framing, retro comic energy",
      negative:
        "3d render, photorealistic, painterly watercolor, soft gradients, anime, muted palette, thin lines, modern digital art",
      turnaroundNotes: "retro animation model sheet, flat colours, thick consistent outlines",
    },
    loras: [],
    generation: { guidanceScale: 4.0, numInferenceSteps: 26, referenceScale: 0.6 },
    palette: { sky: ["#38b6ff", "#fff27a"], ground: "#4cd964", accent: "#ff2d55", ink: "#111111" },
    typography: { fontFamily: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif", pdfFont: "helvetica" },
  },
};

export const ANIMATION_STYLE_LIST: AnimationStyle[] = Object.values(ANIMATION_STYLES);

export function getAnimationStyle(id: AnimationStyleId): AnimationStyle {
  const style = ANIMATION_STYLES[id];
  if (!style) throw new Error(`Unknown animation style: ${id}`);
  return style;
}
