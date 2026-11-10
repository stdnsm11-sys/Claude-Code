import { connection } from "next/server";
import { resolveProviders } from "@/lib/server/env";
import { FAL_CONFIG, REPLICATE_CONFIG } from "@/config/imageModels";
import { ANTHROPIC_MODEL } from "@/lib/server/env";

/** Tells the UI which providers are live (never exposes secrets). */
export async function GET() {
  // Env (and therefore provider availability) must be read per request, not at build time.
  await connection();
  const p = resolveProviders(false);
  return Response.json({
    llm: p.llm,
    llmModel: p.llm === "anthropic" ? ANTHROPIC_MODEL : "mock",
    image: p.image,
    imageModel: p.image === "fal" ? FAL_CONFIG.model : p.image === "replicate" ? REPLICATE_CONFIG.model : "mock",
    notes: p.notes,
  });
}
