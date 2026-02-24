export const VIDEO_PIPELINE_MAX_RETRY_ATTEMPTS = 5;

const BASE_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 15 * 60_000;
const RETRY_JITTER_RATIO = 0.2;

export function getRetryBackoffMs(attemptCount: number): number {
  const safeAttempt = Math.max(1, attemptCount);
  const rawDelay = BASE_RETRY_DELAY_MS * 2 ** (safeAttempt - 1);
  const bounded = Math.min(rawDelay, MAX_RETRY_DELAY_MS);
  const jitter = Math.floor(bounded * RETRY_JITTER_RATIO * Math.random());
  return bounded + jitter;
}

export function canAutoRetry(attemptCount: number): boolean {
  return attemptCount < VIDEO_PIPELINE_MAX_RETRY_ATTEMPTS;
}

export function getRetryEtaIso(attemptCount: number): string {
  const delayMs = getRetryBackoffMs(attemptCount);
  return new Date(Date.now() + delayMs).toISOString();
}
