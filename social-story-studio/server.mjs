// StoryStage local server: serves the app and writes stories with the Claude API.
//
//   cd social-story-studio
//   npm install
//   export ANTHROPIC_API_KEY=sk-ant-...      (or run `ant auth login` once)
//   npm start                                 -> http://localhost:5173
//
// The browser never sees the API key. The page POSTs the teacher's settings to
// /api/story and this server builds the prompt and calls Claude.

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const MODEL = process.env.STORY_MODEL || "claude-opus-5-5";
const client = new Anthropic();

// Keep these lists in sync with the renderer in index.html: every style can draw every value.
const ENUMS = {
  type: ["descriptive", "perspective", "directive", "affirmative"],
  setting: ["classroom", "hallway", "outside", "cafeteria", "home"],
  prop: ["clock", "bell", "line", "ears", "door", "star", "heart", "tray", "swing", "scissors"],
  emotion: ["calm", "worried", "happy"],
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "character", "pages"],
  properties: {
    title: { type: "string" },
    character: { type: "string" },
    pages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "type", "setting", "prop", "emotion", "scene"],
        properties: {
          text: { type: "string" },
          type: { type: "string", enum: ENUMS.type },
          setting: { type: "string", enum: ENUMS.setting },
          prop: { type: "string", enum: ENUMS.prop },
          emotion: { type: "string", enum: ENUMS.emotion },
          scene: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM = `You write social stories for students, following Carol Gray's Social Stories guidance.
- Write in the first person ("I") from the student's point of view, in present or future tense.
- Use mostly descriptive and perspective sentences, with a few gentle directive sentences ("I can...", "I will try to...") and an affirmative ending. Never use "don't", "never", or threats of consequences.
- Be literal, calm, concrete and reassuring. Describe what happens, why, and what others feel. Avoid scary details.
- Match vocabulary and sentence length to the grade band.
- Use only the student's first name if one is given, and no other real names.`;

function buildPrompt(f) {
  return `Write a social story.

Situation (from the teacher): ${f.prompt}
Student first name: ${f.name || "(none - use \"I\" only)"}
Grade band: ${f.grade}
Pages: exactly ${f.pages}
Sentences per page: ${f.sentences}
Animation style the story will be drawn in: ${f.styleName}${f.styleTraits ? ` (${f.styleTraits})` : ""}

For each page return:
- text: the page's words, ${f.sentences} sentence(s).
- type: the main social-story sentence type of the page.
- setting, prop, emotion: pick the closest values from the allowed lists so the app can animate the page. Use "line" for lining up with classmates, "ears" for covering ears or loud sounds, "star" for a proud ending.
- scene: one sentence describing the picture for an illustrator (who is there, what they do, where), with no words or letters in the picture and no art-style words.
Also return:
- title: a short, friendly title${f.name ? ` that includes ${f.name}'s name` : ""}.
- character: one sentence describing the student character's look (age, hair, clothes) so every page stays consistent. Do not mention disability.`;
}

function readForm(body) {
  const clamp = (n, lo, hi, d) => (Number.isFinite(+n) ? Math.min(hi, Math.max(lo, Math.round(+n))) : d);
  const str = (v, max) => String(v ?? "").trim().slice(0, max);
  const f = {
    prompt: str(body.prompt, 2000),
    name: str(body.name, 40).replace(/[^\p{L}\p{M}' -]/gu, ""),
    grade: str(body.grade, 40) || "Grades 1-2",
    pages: clamp(body.pages, 3, 10, 6),
    sentences: clamp(body.sentences, 1, 3, 2),
    styleName: str(body.styleName, 80) || "Soft 3D",
    styleTraits: str(body.styleTraits, 400),
  };
  if (!f.prompt) throw new StoryError(400, "Describe the situation first.");
  return f;
}

class StoryError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function writeStory(f) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // If a safety classifier declines, retry on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: buildPrompt(f) }],
  });

  if (response.stop_reason === "refusal") {
    throw new StoryError(422, "Claude declined to write this story. Try rewording the situation.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new StoryError(502, "The story was cut off. Try fewer pages.");
  }
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const story = JSON.parse(text);
  story.pages = story.pages.slice(0, f.pages);
  return story;
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 64 * 1024) throw new StoryError(413, "Request too large.");
    chunks.push(c);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new StoryError(400, "Request body must be JSON."); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = await readFile(path.join(here, "index.html"), "utf8");
      return send(res, 200, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${html}</body></html>`, "text/html; charset=utf-8");
    }
    if (req.method === "POST" && url.pathname === "/api/story") {
      const form = readForm(await readJson(req));
      const story = await writeStory(form);
      return send(res, 200, story);
    }
    send(res, 404, { error: "Not found" });
  } catch (err) {
    if (err instanceof StoryError) return send(res, err.status, { error: err.message });
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Claude API key missing or invalid.");
      return send(res, 401, { error: "The server's Claude API key is missing or invalid. Set ANTHROPIC_API_KEY and restart." });
    }
    if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: "Claude is busy right now. Wait a minute and try again." });
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude API error ${err.status}:`, err.message);
      return send(res, 502, { error: `Claude API error (${err.status ?? "network"}). Try again.` });
    }
    if (err instanceof SyntaxError) return send(res, 502, { error: "Claude's answer was not valid story data. Try again." });
    console.error(err);
    send(res, 500, { error: "Something went wrong on the server." });
  }
});

server.listen(PORT, () => console.log(`StoryStage running at http://localhost:${PORT}  (model: ${MODEL})`));
