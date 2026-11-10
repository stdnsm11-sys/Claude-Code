"use client";

import { useEffect, useState } from "react";
import { StoryConfigForm } from "@/components/config/StoryConfigForm";
import { DraftList } from "@/components/home/DraftList";
import { ProviderBadges } from "@/components/home/ProviderBadge";
import { fetchStatus, type ProviderStatus } from "@/lib/client/api";

export default function HomePage() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  useEffect(() => {
    fetchStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl tracking-tight">Forge an illustrated storybook</h1>
          <p className="max-w-2xl text-muted-foreground">
            One prompt becomes a character bible, a reference turnaround sheet, and up to 20 consistently illustrated
            pages you can edit, flip through and export as a PDF.
          </p>
        </div>
        <ProviderBadges status={status} />
      </section>
      <DraftList />
      <StoryConfigForm status={status} />
    </div>
  );
}
