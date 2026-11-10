"use client";

import { jsPDF } from "jspdf";
import pLimit from "p-limit";
import { AGE_GROUPS } from "@/config/ageGroups";
import { getAnimationStyle } from "@/config/animationStyles";
import type { Book } from "@/types/book";

/**
 * PDF export with jsPDF, drawn directly (no html2canvas) so text stays vector
 * and illustrations keep their native resolution.
 *
 *  - "print":  A4 portrait. Full-bleed 4:3 illustration on top, typeset text below.
 *  - "tablet": 4:3 landscape pages. Full-bleed illustration with a text panel,
 *              sized for reading on a tablet with no cropping.
 */
export type PdfLayout = "print" | "tablet";

interface LoadedImage {
  data: string;
  width: number;
  height: number;
}

async function loadImage(url: string): Promise<LoadedImage> {
  // Remote provider images go through our same-origin proxy so the canvas isn't tainted.
  const src = url.startsWith("data:") || url.startsWith("blob:") ? url : `/api/image-proxy?url=${encodeURIComponent(url)}`;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const isSvg = url.startsWith("data:image/svg");
  const scale = isSvg ? 2 : 1; // rasterise vector demo art at 2x
  const width = (img.naturalWidth || 1024) * scale;
  const height = (img.naturalHeight || 768) * scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return { data: canvas.toDataURL("image/jpeg", 0.92), width, height };
}

/** Draw an image to fill a box, centre-cropping to the box aspect. */
function drawCover(doc: jsPDF, img: LoadedImage, x: number, y: number, w: number, h: number) {
  const boxRatio = w / h;
  const imgRatio = img.width / img.height;
  if (Math.abs(boxRatio - imgRatio) < 0.01) {
    doc.addImage(img.data, "JPEG", x, y, w, h, undefined, "FAST");
    return;
  }
  // Scale up and let the clip rectangle crop the overflow.
  let dw = w;
  let dh = w / imgRatio;
  if (dh < h) {
    dh = h;
    dw = h * imgRatio;
  }
  doc.saveGraphicsState();
  doc.rect(x, y, w, h);
  doc.clip();
  doc.discardPath();
  doc.addImage(img.data, "JPEG", x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, undefined, "FAST");
  doc.restoreGraphicsState();
}

const fileName = (title: string) =>
  `${title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "storybook"}.pdf`;

export async function exportBookPdf(
  book: Book,
  layout: PdfLayout,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const style = getAnimationStyle(book.config.styleId);
  const font = style.typography.pdfFont;
  const age = AGE_GROUPS[book.config.ageGroup];
  const bodySize = age.id === "toddler" ? 22 : age.id === "early-reader" ? 17 : 13;

  // Load every illustration up front (bounded concurrency).
  const urls = book.pages.map((p) => p.illustration.image?.url);
  const coverUrl = urls.find(Boolean) ?? book.reference.image?.url;
  const total = urls.filter(Boolean).length + (coverUrl ? 1 : 0);
  let done = 0;
  const limit = pLimit(4);
  const tick = () => onProgress?.(++done, total);
  const [cover, ...images] = await Promise.all([
    coverUrl ? limit(() => loadImage(coverUrl).finally(tick)) : Promise.resolve(undefined),
    ...urls.map((u) => (u ? limit(() => loadImage(u).finally(tick)) : Promise.resolve(undefined))),
  ]);

  const doc =
    layout === "print"
      ? new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      : new jsPDF({ orientation: "landscape", unit: "mm", format: [280, 210] });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setProperties({ title: book.title, subject: book.logline, creator: "StoryForge Studio" });

  // ---- Cover ----
  doc.setFillColor(41, 37, 36);
  doc.rect(0, 0, W, H, "F");
  if (cover) drawCover(doc, cover, 0, 0, W, layout === "print" ? W * 0.75 : H * 0.72);
  const titleTop = layout === "print" ? W * 0.75 + 30 : H * 0.72 + 16;
  doc.setTextColor(250, 250, 249);
  doc.setFont(font, "bold");
  doc.setFontSize(layout === "print" ? 34 : 28);
  const titleLines = doc.splitTextToSize(book.title, W - 40);
  doc.text(titleLines, W / 2, titleTop, { align: "center" });
  doc.setFont(font, "normal");
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(book.logline, W - 50), W / 2, titleTop + titleLines.length * 12 + 4, { align: "center" });

  // ---- Story pages ----
  book.pages.forEach((page, i) => {
    doc.addPage();
    const img = images[i];
    doc.setFillColor(251, 246, 234);
    doc.rect(0, 0, W, H, "F");

    if (layout === "print") {
      const imgH = W * 0.75; // 4:3, full bleed
      if (img) drawCover(doc, img, 0, 0, W, imgH);
      doc.setTextColor(41, 37, 36);
      doc.setFont(font, "normal");
      doc.setFontSize(bodySize);
      const margin = 22;
      const lines = doc.splitTextToSize(page.storyText, W - margin * 2);
      const lineH = bodySize * 0.3528 * 1.5; // pt -> mm, 1.5 leading
      const blockH = lines.length * lineH;
      const areaTop = imgH + 12;
      const areaH = H - areaTop - 20;
      doc.text(lines, W / 2, areaTop + Math.max(0, (areaH - blockH) / 2) + lineH * 0.8, {
        align: "center",
        lineHeightFactor: 1.5,
      });
      doc.setFontSize(9);
      doc.setTextColor(120, 113, 108);
      doc.text(String(page.pageNumber), W / 2, H - 10, { align: "center" });
    } else {
      if (img) drawCover(doc, img, 0, 0, W, H);
      doc.setFont(font, "normal");
      doc.setFontSize(bodySize);
      const panelW = W - 40;
      const lines = doc.splitTextToSize(page.storyText, panelW - 16);
      const lineH = bodySize * 0.3528 * 1.45;
      const panelH = lines.length * lineH + 12;
      const panelY = H - panelH - 10;
      doc.setFillColor(251, 246, 234);
      doc.setGState(doc.GState({ opacity: 0.88 }));
      doc.roundedRect(20, panelY, panelW, panelH, 4, 4, "F");
      doc.setGState(doc.GState({ opacity: 1 }));
      doc.setTextColor(41, 37, 36);
      doc.text(lines, W / 2, panelY + 6 + lineH * 0.8, { align: "center", lineHeightFactor: 1.45 });
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(String(page.pageNumber), W - 8, 10, { align: "right" });
    }
  });

  // ---- Back cover ----
  doc.addPage();
  doc.setFillColor(41, 37, 36);
  doc.rect(0, 0, W, H, "F");
  doc.setTextColor(250, 250, 249);
  doc.setFont(font, "bold");
  doc.setFontSize(30);
  doc.text("The End", W / 2, H / 2, { align: "center" });
  doc.setFont(font, "normal");
  doc.setFontSize(10);
  doc.text(`Illustrated in the ${style.label} style · Made with StoryForge Studio`, W / 2, H - 16, { align: "center" });

  doc.save(fileName(book.title));
}
