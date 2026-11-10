import { ANIMATION_STYLES } from "@/config/animationStyles";
import { hashString, mulberry32, sleep } from "@/lib/mock/random";
import type { ImageGenerationRequest, ImageGenerationResult, ImageProvider } from "./types";

/**
 * Demo-mode renderer: draws a deterministic SVG "illustration" from the style
 * palette, the characters' bible colours and the seed. No network, no credits,
 * but every downstream feature (queue, progress, regenerate, flipbook, PDF)
 * is exercised exactly as with a real provider.
 */

const NAMED: Record<string, string> = {
  red: "#d64541", crimson: "#b8323a", scarlet: "#e03c31", rust: "#b7472a", orange: "#ef8a32", amber: "#f0a830",
  mustard: "#d9a21b", yellow: "#f4d03f", gold: "#d4a017", cream: "#f6ecd2", beige: "#d9c4a0", tan: "#c8a27a",
  brown: "#8b5a2b", chocolate: "#5d3a1a", green: "#4c9a4c", forest: "#2f6b3a", olive: "#7a8a3a", mint: "#9fd8b8",
  teal: "#2a8c8c", turquoise: "#38b2ac", blue: "#3b7dd8", navy: "#22336b", sky: "#87c4ea", indigo: "#4b3f9e",
  purple: "#7d4bb3", plum: "#7a3b69", violet: "#8f5bd6", lavender: "#b9a3e3", pink: "#ef8fb1", rose: "#e06a8a",
  white: "#f8f8f2", grey: "#8c8c8c", gray: "#8c8c8c", silver: "#c0c4c8", black: "#2a2a2a", charcoal: "#3a3a3a",
};

function colorFromName(name: string, fallbackSeed: number): string {
  const words = name.toLowerCase().split(/[^a-z]+/).reverse();
  for (const w of words) if (NAMED[w]) return NAMED[w];
  const hue = (hashString(name) + fallbackSeed) % 360;
  return `hsl(${hue} 55% 55%)`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

interface Look {
  outline: string;
  strokeWidth: number;
  grain: number;
  rounded: boolean;
}

function lookFor(styleId: ImageGenerationRequest["meta"]["styleId"]): Look {
  switch (styleId) {
    case "saturday-morning":
      return { outline: "#111", strokeWidth: 6, grain: 0.04, rounded: true };
    case "vector-folklore":
      return { outline: "#14213d", strokeWidth: 4, grain: 0.1, rounded: false };
    case "stop-motion":
      return { outline: "rgba(0,0,0,0.25)", strokeWidth: 2, grain: 0.22, rounded: true };
    case "golden-age-cel":
      return { outline: "#2b1d14", strokeWidth: 3, grain: 0.16, rounded: true };
    case "3d-feature":
      return { outline: "rgba(0,0,0,0.15)", strokeWidth: 1.5, grain: 0.03, rounded: true };
    default:
      return { outline: "#3b3a36", strokeWidth: 2.5, grain: 0.12, rounded: true };
  }
}

function figure(
  x: number,
  groundY: number,
  scale: number,
  colors: string[],
  look: Look,
  view: "front" | "three-quarter" | "side" | "back",
  seed: number,
): string {
  const [body, head, accent, extra] = [
    colors[0] ?? "#c86b3c",
    colors[1] ?? "#f2dcb8",
    colors[2] ?? "#d9a21b",
    colors[3] ?? "#2f6b3a",
  ];
  const s = scale;
  const st = `stroke="${look.outline}" stroke-width="${look.strokeWidth}"`;
  const h = 150 * s;
  const bodyShape = look.rounded
    ? `<ellipse cx="${x}" cy="${groundY - h * 0.38}" rx="${42 * s}" ry="${h * 0.34}" fill="${accent}" ${st}/>`
    : `<polygon points="${x - 46 * s},${groundY - 12 * s} ${x + 46 * s},${groundY - 12 * s} ${x},${groundY - h * 0.74}" fill="${accent}" ${st}/>`;
  const headY = groundY - h * 0.82;
  const eyeOffset = view === "front" ? 0 : view === "three-quarter" ? 10 * s : 22 * s;
  const eyes =
    view === "back"
      ? ""
      : `<circle cx="${x - 12 * s + eyeOffset}" cy="${headY - 2 * s}" r="${5 * s}" fill="#1d1d1d"/>` +
        (view === "side" ? "" : `<circle cx="${x + 12 * s + eyeOffset}" cy="${headY - 2 * s}" r="${5 * s}" fill="#1d1d1d"/>`);
  const ears = `<polygon points="${x - 30 * s},${headY - 22 * s} ${x - 14 * s},${headY - 62 * s} ${x - 2 * s},${headY - 28 * s}" fill="${body}" ${st}/>
    <polygon points="${x + 30 * s},${headY - 22 * s} ${x + 14 * s},${headY - 62 * s} ${x + 2 * s},${headY - 28 * s}" fill="${body}" ${st}/>`;
  const tail =
    seed % 2 === 0
      ? `<path d="M ${x + 36 * s} ${groundY - 40 * s} q ${60 * s} ${-10 * s} ${50 * s} ${-70 * s}" fill="none" stroke="${body}" stroke-width="${18 * s}" stroke-linecap="round"/>`
      : "";
  return `<g>
    <ellipse cx="${x}" cy="${groundY}" rx="${52 * s}" ry="${9 * s}" fill="rgba(0,0,0,0.18)"/>
    ${tail}
    <rect x="${x - 26 * s}" y="${groundY - 20 * s}" width="${18 * s}" height="${20 * s}" rx="${4 * s}" fill="${extra}" ${st}/>
    <rect x="${x + 8 * s}" y="${groundY - 20 * s}" width="${18 * s}" height="${20 * s}" rx="${4 * s}" fill="${extra}" ${st}/>
    ${bodyShape}
    ${ears}
    <circle cx="${x}" cy="${headY}" r="${36 * s}" fill="${body}" ${st}/>
    ${view === "back" ? "" : `<ellipse cx="${x + eyeOffset}" cy="${headY + 14 * s}" rx="${18 * s}" ry="${12 * s}" fill="${head}"/>`}
    ${eyes}
  </g>`;
}

function grainFilter(id: string, amount: number) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 ${amount} 0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>`;
}

export function renderMockSvg(req: ImageGenerationRequest): string {
  const style = ANIMATION_STYLES[req.meta.styleId];
  const look = lookFor(req.meta.styleId);
  const rand = mulberry32(req.seed);
  const { width: W, height: H } = req;
  const chars = req.meta.characters.map((c, i) => c.colors.map((n) => colorFromName(n, i * 97 + req.seed)));

  if (req.kind === "reference") {
    const views = ["front", "three-quarter", "side", "back"] as const;
    const rows = Math.max(1, chars.length);
    const rowH = (H - 60) / rows;
    const figures = chars
      .map((colors, r) => {
        const groundY = 40 + rowH * (r + 1) - 18;
        const scale = Math.min(1.1, rowH / 190);
        const label = esc(req.meta.characters[r].name.toUpperCase());
        return (
          `<text x="24" y="${groundY - rowH + 46}" font-family="Georgia, serif" font-size="22" fill="${style.palette.ink}">${label}</text>` +
          views
            .map((v, i) => {
              const x = 200 + i * ((W - 260) / 4) + 60;
              return (
                figure(x, groundY, scale, colors, look, v, r) +
                `<text x="${x}" y="${groundY + 22}" text-anchor="middle" font-family="Helvetica, sans-serif" font-size="13" fill="#888">${v}</text>`
              );
            })
            .join("")
        );
      })
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>${grainFilter("g", look.grain)}</defs>
      <rect width="100%" height="100%" fill="#faf7f0"/>
      <g stroke="#ece6d8" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${(i * H) / 12}" x2="${W}" y2="${(i * H) / 12}"/>`).join("")}</g>
      ${figures}
      <text x="${W - 20}" y="28" text-anchor="end" font-family="Helvetica, sans-serif" font-size="14" fill="#aaa">DEMO REFERENCE SHEET · ${esc(style.label)} · seed ${req.seed}</text>
      <rect width="100%" height="100%" filter="url(#g)"/>
    </svg>`;
  }

  // Story page
  const [skyTop, skyBottom] = style.palette.sky;
  const night = /night|dusk|dark|star|moon|blue light/i.test(req.meta.mood ?? "");
  const sunX = 120 + rand() * (W - 240);
  const sunY = 80 + rand() * 120;
  const hills = [0, 1, 2]
    .map((i) => {
      const y = H * (0.6 + i * 0.1);
      const amp = 40 + rand() * 50;
      const shade = i === 0 ? 0.55 : i === 1 ? 0.8 : 1;
      return `<path d="M0 ${y} C ${W * 0.25} ${y - amp}, ${W * 0.5} ${y + amp * 0.6}, ${W * 0.75} ${y - amp * 0.4} S ${W} ${y - amp * 0.2}, ${W} ${y} L ${W} ${H} L 0 ${H} Z" fill="${style.palette.ground}" opacity="${shade}" stroke="${look.outline}" stroke-width="${look.strokeWidth * 0.6}"/>`;
    })
    .join("");
  const trees = Array.from({ length: 4 + Math.floor(rand() * 5) }, () => {
    const x = rand() * W;
    const y = H * (0.58 + rand() * 0.12);
    const r = 24 + rand() * 30;
    return look.rounded
      ? `<rect x="${x - 5}" y="${y}" width="10" height="${r * 1.2}" fill="#6b4a2b"/><circle cx="${x}" cy="${y}" r="${r}" fill="${style.palette.ground}" stroke="${look.outline}" stroke-width="${look.strokeWidth * 0.6}" opacity="0.95"/>`
      : `<polygon points="${x - r},${y + r} ${x + r},${y + r} ${x},${y - r * 1.4}" fill="${style.palette.ground}" stroke="${look.outline}" stroke-width="${look.strokeWidth * 0.6}"/>`;
  }).join("");
  const groundY = H * 0.86;
  const figures = chars
    .map((colors, i) => {
      const x = W * (0.3 + (i * 0.4) / Math.max(1, chars.length - 1 || 1)) + (rand() - 0.5) * 80;
      const view = (["front", "three-quarter", "side"] as const)[Math.floor(rand() * 3)];
      return figure(chars.length === 1 ? W * (0.35 + rand() * 0.3) : x, groundY, 1.15 - i * 0.12, colors, look, view, i);
    })
    .join("");
  const stars = night
    ? Array.from({ length: 40 }, () => `<circle cx="${rand() * W}" cy="${rand() * H * 0.45}" r="${1 + rand() * 2}" fill="#fff" opacity="${0.5 + rand() * 0.5}"/>`).join("")
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${night ? "#1f2a5a" : skyTop}"/>
        <stop offset="1" stop-color="${night ? "#7a5a8c" : skyBottom}"/>
      </linearGradient>
      ${grainFilter("g", look.grain)}
    </defs>
    <rect width="100%" height="100%" fill="url(#sky)"/>
    ${stars}
    <circle cx="${sunX}" cy="${sunY}" r="${night ? 38 : 60}" fill="${night ? "#f4f1d0" : style.palette.accent}" opacity="0.9"/>
    ${hills}
    ${trees}
    ${figures}
    <rect x="${W - 150}" y="${H - 44}" width="134" height="28" rx="6" fill="rgba(255,255,255,0.75)"/>
    <text x="${W - 83}" y="${H - 25}" text-anchor="middle" font-family="Helvetica, sans-serif" font-size="13" fill="#555">DEMO · p${req.meta.pageNumber ?? "?"} · ${req.seed % 10000}</text>
    <rect width="100%" height="100%" filter="url(#g)"/>
  </svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export class MockImageProvider implements ImageProvider {
  readonly id = "mock" as const;
  readonly model = "storyforge-mock-svg";
  readonly supportsReference = true;
  readonly supportsNegativePrompt = true;

  constructor(private readonly latencyMs: [number, number] = [500, 1600]) {}

  async generate(req: ImageGenerationRequest, signal?: AbortSignal): Promise<ImageGenerationResult> {
    const [lo, hi] = this.latencyMs;
    await sleep(lo + Math.random() * (hi - lo), signal);
    return { url: svgToDataUrl(renderMockSvg(req)), seed: req.seed, width: req.width, height: req.height };
  }
}
