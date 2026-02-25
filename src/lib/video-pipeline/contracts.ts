import {
  type VideoAssetRecord,
  type VideoPipelineError,
  type VideoProcessingStatus,
} from "@/lib/video-pipeline/types";
import { isVideoProcessingStatus } from "@/lib/video-pipeline/status";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_LOWER_HEX_RE = /^[0-9a-f]{64}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface CreateVideoAssetRequest {
  postId: string;
  sourceUrl: string;
  sourceFileSha256?: string | null;
  sourceStoragePath?: string | null;
  providerRequestId?: string | null;
}

export interface RetryVideoAssetRequest {
  assetId: string;
  reason?: string | null;
}

export interface VideoAssetContractData {
  assetId: string;
  postId: string;
  status: VideoProcessingStatus;
  idempotent: boolean;
  playback: {
    manifestUrl: string | null;
    progressiveUrl: string | null;
    posterUrl: string | null;
    thumbnailUrl: string | null;
  };
  error: {
    code: string | null;
    message: string | null;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  };
}

export interface NormalizedWebhookPayload {
  provider: string;
  providerJobId: string;
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
  raw: Record<string, unknown>;
}

export function parseCreateVideoAssetRequest(
  body: unknown,
): CreateVideoAssetRequest | null {
  if (!isObject(body)) return null;
  if (!isUuid(body.postId)) return null;
  if (typeof body.sourceUrl !== "string" || body.sourceUrl.trim().length < 1) {
    return null;
  }

  const sourceFileSha256 = asOptionalString(body.sourceFileSha256);
  if (
    sourceFileSha256 !== null &&
    !SHA256_LOWER_HEX_RE.test(sourceFileSha256)
  ) {
    return null;
  }

  return {
    postId: body.postId,
    sourceUrl: body.sourceUrl.trim(),
    sourceFileSha256,
    sourceStoragePath: asOptionalString(body.sourceStoragePath),
    providerRequestId: asOptionalString(body.providerRequestId),
  };
}

export function parseRetryVideoAssetRequest(
  body: unknown,
): RetryVideoAssetRequest | null {
  if (!isObject(body)) return null;
  if (!isUuid(body.assetId)) return null;

  return {
    assetId: body.assetId,
    reason: asOptionalString(body.reason),
  };
}

export function buildVideoAssetContractData(params: {
  record: VideoAssetRecord;
  idempotent?: boolean;
}): VideoAssetContractData {
  const { record, idempotent = false } = params;
  return {
    assetId: record.id,
    postId: record.post_id,
    status: record.status,
    idempotent,
    playback: {
      manifestUrl: record.manifest_url,
      progressiveUrl: record.progressive_url,
      posterUrl: record.poster_url,
      thumbnailUrl: record.thumbnail_url,
    },
    error: {
      code: record.error_code,
      message: record.error_message,
    },
    timestamps: {
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      completedAt: record.completed_at,
    },
  };
}

export function normalizeWebhookPayload(
  body: unknown,
): NormalizedWebhookPayload | VideoPipelineError {
  if (!isObject(body)) {
    return { ok: false, code: "BAD_REQUEST", error: "Bad webhook payload" };
  }

  const provider = asOptionalString(body.provider);
  const providerJobId = asOptionalString(body.providerJobId);
  const externalStatus = asOptionalString(body.status);
  const mappedStatus = body.internalStatus;

  if (!provider || !providerJobId || !externalStatus) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      error: "Webhook payload missing required fields",
    };
  }

  if (!isVideoProcessingStatus(mappedStatus)) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      error: "Webhook payload has invalid internal status",
    };
  }

  return {
    provider,
    providerJobId,
    externalStatus,
    internalStatus: mappedStatus,
    output: {
      manifestUrl: asOptionalString(body.manifestUrl),
      progressiveUrl: asOptionalString(body.progressiveUrl),
      posterUrl: asOptionalString(body.posterUrl),
      thumbnailUrl: asOptionalString(body.thumbnailUrl),
      durationSec:
        typeof body.durationSec === "number" && body.durationSec >= 0
          ? Math.floor(body.durationSec)
          : null,
      width:
        typeof body.width === "number" && body.width >= 0
          ? Math.floor(body.width)
          : null,
      height:
        typeof body.height === "number" && body.height >= 0
          ? Math.floor(body.height)
          : null,
      bitrateKbps:
        typeof body.bitrateKbps === "number" && body.bitrateKbps >= 0
          ? Math.floor(body.bitrateKbps)
          : null,
    },
    error: {
      code: asOptionalString(body.errorCode),
      message: asOptionalString(body.errorMessage),
    },
    raw: body,
  };
}
