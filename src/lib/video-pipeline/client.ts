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

  return {
    ok: true,
    data: payload.data as unknown as VideoAssetContractData,
  };
}

export async function fetchVideoAssetStatusByPost(
  postId: string,
): Promise<VideoAssetContractData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`/api/video-assets/${postId}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!isRecord(payload) || payload.ok !== true || !isRecord(payload.data)) {
    return null;
  }
  return payload.data as unknown as VideoAssetContractData;
}
