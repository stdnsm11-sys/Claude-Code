import pLimit from "p-limit";
import { sleep } from "@/lib/mock/random";
import { ImageProviderError } from "@/lib/image/types";

/**
 * Generic concurrency-limited job queue with retries + exponential backoff and
 * per-job lifecycle callbacks (used to stream progress over SSE).
 */
export interface QueueJob<T> {
  key: number;
  run: (signal: AbortSignal) => Promise<T>;
}

export interface QueueCallbacks<T> {
  onStart?: (key: number, attempt: number) => void;
  onSuccess?: (key: number, value: T) => void;
  onRetry?: (key: number, attempt: number, error: Error, delayMs: number) => void;
  onFailure?: (key: number, error: Error) => void;
}

export interface QueueOptions {
  concurrency: number;
  maxAttempts: number;
  baseDelayMs?: number;
  signal: AbortSignal;
}

export async function runQueue<T>(jobs: QueueJob<T>[], opts: QueueOptions, cb: QueueCallbacks<T> = {}) {
  const limit = pLimit(opts.concurrency);
  const base = opts.baseDelayMs ?? 1500;
  let succeeded = 0;
  let failed = 0;

  await Promise.all(
    jobs.map((job) =>
      limit(async () => {
        for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
          if (opts.signal.aborted) return;
          cb.onStart?.(job.key, attempt);
          try {
            const value = await job.run(opts.signal);
            succeeded++;
            cb.onSuccess?.(job.key, value);
            return;
          } catch (raw) {
            if (opts.signal.aborted) return;
            const err = raw instanceof Error ? raw : new Error(String(raw));
            const retryable = !(err instanceof ImageProviderError) || err.retryable;
            if (!retryable || attempt === opts.maxAttempts) {
              failed++;
              cb.onFailure?.(job.key, err);
              return;
            }
            const delay = base * 2 ** (attempt - 1) + Math.random() * 400;
            cb.onRetry?.(job.key, attempt, err, delay);
            try {
              await sleep(delay, opts.signal);
            } catch {
              return; // aborted during backoff
            }
          }
        }
      }),
    ),
  );

  return { succeeded, failed, aborted: opts.signal.aborted };
}
