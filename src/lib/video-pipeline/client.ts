"use client";

import { supabase } from "@/lib/supabase/client";
import type { VideoAssetContractData } from "@/lib/video-pipeline/contracts";

interface ApiErrorShape {
  ok: false;
  code?: string;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const NO_ASSET_CACHE_TTL_MS = 2 * 60_000;
const noAssetCache = new Map<string, number>();
const NO_ASSET_STORAGE_KEY_PREFIX = "video-pipeline:no-asset:";

function getStorageKey(postId: string): string {
  return `${NO_ASSET_STORAGE_KEY_PREFIX}${postId}`;
}

function readStorageMark(postId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(postId));
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorageMark(postId: string, timestampMs: number) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(getStorageKey(postId), String(timestampMs));
  } catch {
    // Storage may be unavailable (privacy mode/quota); in-memory cache is enough.
  }
}

function clearStorageMark(postId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(getStorageKey(postId));
  } catch {
    // Ignore storage cleanup errors.
  }
}

function hasFreshNoAssetMark(postId: string): boolean {
  const markedAt = noAssetCache.get(postId) ?? readStorageMark(postId) ?? undefined;
  if (!markedAt) return false;
  if (Date.now() - markedAt > NO_ASSET_CACHE_TTL_MS) {
    noAssetCache.delete(postId);
    clearStorageMark(postId);
    return false;
  }
  noAssetCache.set(postId, markedAt);
  return true;
}

function markNoAsset(postId: string) {
  const now = Date.now();
  noAssetCache.set(postId, now);
  writeStorageMark(postId, now);
}

function clearNoAssetMark(postId: string) {
  noAssetCache.delete(postId);
  clearStorageMark(postId);
}

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function registerVideoAssetForPost(params: {
  postId: string;
  sourceUrl: string;
}): Promise<{ ok: true; data: VideoAssetContractData } | ApiErrorShape> {
  // A publish flow may have just created an asset; remove stale no-asset marks.
  clearNoAssetMark(params.postId);

  const token = await getAccessToken();
  if (!token) {
    return { ok: false, code: "UNAUTHORIZED", error: "Unauthorized" };
  }

  const response = await fetch("/api/video-assets/create", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      postId: params.postId,
      sourceUrl: params.sourceUrl,
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    if (isRecord(payload)) {
      return {
        ok: false,
        code: typeof payload.code === "string" ? payload.code : "INTERNAL_ERROR",
        error:
          typeof payload.error === "string"
            ? payload.error
            : "Create request failed",
      };
    }
    return { ok: false, code: "INTERNAL_ERROR", error: "Create request failed" };
  }
  if (!isRecord(payload) || payload.ok !== true || !isRecord(payload.data)) {
    return { ok: false, code: "INTERNAL_ERROR", error: "Invalid create response" };
  }

  clearNoAssetMark(params.postId);

  return {
    ok: true,
    data: payload.data as unknown as VideoAssetContractData,
  };
}

export async function fetchVideoAssetStatusByPost(
  postId: string,
): Promise<VideoAssetContractData | null> {
  // Terminal no-asset path for legacy posts: avoid repeated 404 polling noise.
  if (hasFreshNoAssetMark(postId)) return null;

  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`/api/video-assets/${postId}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      markNoAsset(postId);
    }
    return null;
  }
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!isRecord(payload) || payload.ok !== true || !isRecord(payload.data)) {
    return null;
  }
  clearNoAssetMark(postId);
  return payload.data as unknown as VideoAssetContractData;
}
