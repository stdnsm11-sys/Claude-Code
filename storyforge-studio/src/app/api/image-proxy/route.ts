import type { NextRequest } from "next/server";


/**
 * Same-origin proxy for provider CDN images so the PDF exporter can draw them
 * onto a canvas without CORS tainting. Restricted to known provider hosts to
 * avoid becoming an open proxy (SSRF).
 */
const ALLOWED_HOST_SUFFIXES = ["fal.media", "fal.run", "fal.ai", "replicate.delivery", "replicate.com"];

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new Response("Bad url", { status: 400 });
  }
  const allowed =
    url.protocol === "https:" && ALLOWED_HOST_SUFFIXES.some((s) => url.hostname === s || url.hostname.endsWith(`.${s}`));
  if (!allowed) return new Response("Host not allowed", { status: 403 });

  const upstream = await fetch(url, { redirect: "error" }).catch(() => null);
  if (!upstream?.ok || !upstream.body) return new Response("Upstream fetch failed", { status: 502 });
  const type = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!type.startsWith("image/")) return new Response("Not an image", { status: 415 });
  return new Response(upstream.body, {
    headers: { "Content-Type": type, "Cache-Control": "private, max-age=86400" },
  });
}
