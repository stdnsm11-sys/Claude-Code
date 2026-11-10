import { Badge } from "@/components/ui/badge";
import type { ProviderStatus } from "@/lib/client/api";

export function ProviderBadges({ status }: { status: ProviderStatus | null }) {
  if (!status) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant={status.llm === "mock" ? "warning" : "success"}>
        Story: {status.llm === "mock" ? "mock" : status.llmModel}
      </Badge>
      <Badge variant={status.image === "mock" ? "warning" : "success"}>
        Art: {status.image === "mock" ? "mock" : status.imageModel}
      </Badge>
    </div>
  );
}
