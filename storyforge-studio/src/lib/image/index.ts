import "server-only";
import type { ImageProviderId } from "@/lib/server/env";
import { FalFluxGeneralProvider } from "./fal";
import { MockImageProvider } from "./mock";
import { ReplicateFluxProProvider } from "./replicate";
import type { ImageProvider } from "./types";

/** Adapter factory: the only place that knows concrete provider classes. */
export function createImageProvider(id: ImageProviderId): ImageProvider {
  switch (id) {
    case "fal":
      return new FalFluxGeneralProvider();
    case "replicate":
      return new ReplicateFluxProProvider();
    case "mock":
      return new MockImageProvider();
  }
}

export type { ImageProvider } from "./types";
