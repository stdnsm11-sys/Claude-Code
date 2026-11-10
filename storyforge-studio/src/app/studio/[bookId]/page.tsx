import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { StudioView } from "@/components/studio/StudioView";

async function Studio({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  return <StudioView bookId={bookId} />;
}

export default function StudioPage({ params }: PageProps<"/studio/[bookId]">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Studio params={params} />
    </Suspense>
  );
}
