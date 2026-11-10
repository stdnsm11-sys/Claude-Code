"use client";

import { useState } from "react";
import { Download, Loader2, Smartphone, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { exportBookPdf, type PdfLayout } from "@/lib/pdf/exportPdf";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/book";

export function PdfExportButton({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<PdfLayout>("print");
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const missing = book.pages.filter((p) => !p.illustration.image).length;

  async function run() {
    setError(null);
    setProgress([0, 1]);
    try {
      await exportBookPdf(book, layout, (d, t) => setProgress([d, t]));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setProgress(null);
    }
  }

  const options: { id: PdfLayout; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "print", label: "Print (A4 portrait)", desc: "Full-bleed art above typeset text. Good for home printing.", icon: <Printer /> },
    { id: "tablet", label: "Tablet (4:3 landscape)", desc: "Full-page art with a text panel, no cropping.", icon: <Smartphone /> },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download />
          Download PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export storybook</DialogTitle>
          <DialogDescription>
            {missing > 0
              ? `${missing} page(s) have no illustration yet and will be exported text-only.`
              : "All pages are illustrated."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setLayout(o.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent [&_svg]:mt-0.5 [&_svg]:h-5 [&_svg]:w-5",
                layout === o.id && "border-primary ring-1 ring-primary",
              )}
            >
              {o.icon}
              <div>
                <div className="font-medium">{o.label}</div>
                <div className="text-sm text-muted-foreground">{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={run} disabled={!!progress}>
          {progress ? <Loader2 className="animate-spin" /> : <Download />}
          {progress ? `Preparing images ${progress[0]}/${progress[1]}…` : "Export PDF"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
