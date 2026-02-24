import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VideoAssetRecord, VideoProcessingStatus } from "@/lib/video-pipeline/types";

const SUPPORTED_PROVIDER = "external_v1";
const REPLAY_WINDOW_MS = 5 * 60_000;

export interface ProviderSubmitResult {
  provider: string;
  providerJobId: string;
  providerRequestId: string;
}

export interface VerifiedProviderCallback {
  provider: string;
  providerJobId: string;
  providerRequestId: string | null;
  providerEventId: string | null;
  nonce: string | null;
  externalStatus: string;
  internalStatus: VideoProcessingStatus;
  output: {
    manifestUrl: string | null;
    progressiveUrl: string | null;
    posterUrl: string | null;
    thumbnailUrl: string | null;
    durationSec: number | null;
    width: number | null;
    height: number | null;
    bitrateKbps: number | null;
  };
  error: {
    code: string | null;
    message: string | null;
  };
  timestampMs: number;
  replayDetected: boolean;
  raw: Record<string, unknown>;
}

function parseJsonSafe(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNonNegativeInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
}

function mapExternalToInternalStatus(
  externalStatus: string,
): VideoProcessingStatus | null {
  switch (externalStatus.toLowerCase()) {
    case "queued":
      return "queued";
    case "processing":
      return "processing";
    case "ready":
    case "completed":
      return "ready";
    case "failed":
    case "error":
      return "failed";
    case "retrying":
      return "retrying";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}

export async function submitToProvider(params: {
  asset: VideoAssetRecord;
}): Promise<ProviderSubmitResult> {
  const provider = params.asset.provider || SUPPORTED_PROVIDER;
  if (provider !== SUPPORTED_PROVIDER) {
    throw new Error("Unsupported provider");
  }

  const submitUrl = process.env.VIDEO_PIPELINE_PROVIDER_SUBMIT_URL;
  const submitToken = process.env.VIDEO_PIPELINE_PROVIDER_TOKEN;
  const providerRequestId =
    params.asset.provider_request_id ?? randomUUID().replace(/-/g, "");

  if (!submitUrl) {
    return {
      provider,
      providerJobId: `${params.asset.id}-stub`,
      providerRequestId,
    };
  }

  const response = await fetch(submitUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(submitToken ? { authorization: `Bearer ${submitToken}` } : {}),
      "x-provider-request-id": providerRequestId,
    },
    body: JSON.stringify({
      assetId: params.asset.id,
      sourceUrl: params.asset.source_url,
      sourceStoragePath: params.asset.source_storage_path,
      callbackUrl: process.env.VIDEO_PIPELINE_PROVIDER_CALLBACK_URL ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider submit failed (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const providerJobId = asString(payload.providerJobId ?? payload.jobId);
  if (!providerJobId) {
    throw new Error("Provider submit response missing job id");
  }

  return {
    provider,
    providerJobId,
    providerRequestId,
  };
}

export async function verifyAndNormalizeCallback(params: {
  admin: SupabaseClient;
  headers: Headers;
  rawBody: string;
}): Promise<VerifiedProviderCallback> {
  const signature = params.headers.get("x-video-signature");
  const timestampHeader = params.headers.get("x-video-timestamp");
  const nonce = params.headers.get("x-video-nonce");
  const providerEventId = params.headers.get("x-video-event-id");
  const secret = process.env.VIDEO_PIPELINE_WEBHOOK_SECRET;

  if (!signature || !timestampHeader || !nonce || !secret) {
    throw new Error("Missing webhook security headers");
  }

  const timestampMs = Number(timestampHeader);
  if (!Number.isFinite(timestampMs)) {
    throw new Error("Invalid webhook timestamp");
  }

  if (Math.abs(Date.now() - timestampMs) > REPLAY_WINDOW_MS) {
    throw new Error("Webhook timestamp outside replay window");
  }

  const duplicateNonce = await params.admin
    .from("video_processing_events")
    .select("id")
    .eq("event_type", "webhook_nonce_accepted")
    .contains("payload", { nonce })
    .maybeSingle();

  const replayDetected = Boolean(duplicateNonce.data);

  const signedPayload = `${timestampHeader}.${nonce}.${params.rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const got = signature.replace(/^sha256=/i, "").trim();

  const expectedBuf = Buffer.from(expected);
  const gotBuf = Buffer.from(got);
  if (
    expectedBuf.length !== gotBuf.length ||
    !timingSafeEqual(expectedBuf, gotBuf)
  ) {
    throw new Error("Invalid webhook signature");
  }

  const rawPayload = parseJsonSafe(params.rawBody);
  const body = asObject(rawPayload);
  if (!body) {
    throw new Error("Invalid webhook JSON payload");
  }

  const provider = asString(body.provider) ?? SUPPORTED_PROVIDER;
  const providerJobId = asString(body.providerJobId ?? body.jobId);
  const externalStatus = asString(body.status);

  if (!providerJobId || !externalStatus) {
    throw new Error("Webhook payload missing required fields");
  }

  const internalStatus = mapExternalToInternalStatus(externalStatus);
  if (!internalStatus) {
    throw new Error("Webhook payload has unknown provider status");
  }

  return {
    provider,
    providerJobId,
    providerRequestId: asString(body.providerRequestId),
    providerEventId: providerEventId ?? null,
    nonce,
    externalStatus,
    internalStatus,
    output: {
      manifestUrl: asString(body.manifestUrl),
      progressiveUrl: asString(body.progressiveUrl),
      posterUrl: asString(body.posterUrl),
      thumbnailUrl: asString(body.thumbnailUrl),
      durationSec: asNonNegativeInt(body.durationSec),
      width: asNonNegativeInt(body.width),
      height: asNonNegativeInt(body.height),
      bitrateKbps: asNonNegativeInt(body.bitrateKbps),
    },
    error: {
      code: asString(body.errorCode),
      message: asString(body.errorMessage),
    },
    timestampMs,
    replayDetected,
    raw: body,
  };
}
