import type { SupabaseClient } from "@supabase/supabase-js";
import { canTransitionStatus, isVideoProcessingStatus } from "@/lib/video-pipeline/status";
import {
  canAutoRetry,
  getRetryEtaIso,
  VIDEO_PIPELINE_MAX_RETRY_ATTEMPTS,
} from "@/lib/video-pipeline/retry";
import { submitToProvider } from "@/lib/video-pipeline/provider-adapter";
import type { VideoAssetRecord, VideoProcessingStatus } from "@/lib/video-pipeline/types";

interface WorkerContext {
  trigger: "create" | "retry" | "manual";
  reason?: string | null;
  dispatchId?: string | null;
}

function withCtx(ctx: WorkerContext, payload?: Record<string, unknown>) {
  return {
    trigger: ctx.trigger,
    reason: ctx.reason ?? null,
    dispatchId: ctx.dispatchId ?? null,
    ...(payload ?? {}),
  };
}

async function insertEvent(params: {
  admin: SupabaseClient;
  assetId: string;
  eventType: string;
  fromStatus?: VideoProcessingStatus | null;
  toStatus?: VideoProcessingStatus | null;
  message?: string | null;
  payload?: Record<string, unknown>;
}) {
  await params.admin.from("video_processing_events").insert({
    video_asset_id: params.assetId,
    event_type: params.eventType,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    message: params.message ?? null,
    payload: params.payload ?? {},
  });
}

function asAsset(record: Record<string, unknown>): VideoAssetRecord | null {
  if (typeof record.id !== "string" || typeof record.post_id !== "string") {
    return null;
  }
  if (!isVideoProcessingStatus(record.status)) return null;
  return record as unknown as VideoAssetRecord;
}

async function claimAsset(params: {
  admin: SupabaseClient;
  assetId: string;
  fromStatus: VideoProcessingStatus;
  ctx: WorkerContext;
}): Promise<VideoAssetRecord | null> {
  if (!canTransitionStatus(params.fromStatus, "processing")) return null;

  const { data: current } = await params.admin
    .from("video_assets")
    .select("attempt_count")
    .eq("id", params.assetId)
    .eq("status", params.fromStatus)
    .maybeSingle();
  if (!current) return null;

  const nextAttemptCount =
    typeof current.attempt_count === "number" ? current.attempt_count + 1 : 1;

  const { data, error } = await params.admin
    .from("video_assets")
    .update({
      status: "processing",
      attempt_count: nextAttemptCount,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", params.assetId)
    .eq("status", params.fromStatus)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  const claimed = asAsset(data as unknown as Record<string, unknown>);
  if (!claimed) return null;

  await insertEvent({
    admin: params.admin,
    assetId: claimed.id,
    eventType: "job_claimed",
    fromStatus: params.fromStatus,
    toStatus: "processing",
    message: "Asset claimed for processing",
    payload: withCtx(params.ctx, {
      attemptCount: claimed.attempt_count,
    }),
  });

  await insertEvent({
    admin: params.admin,
    assetId: claimed.id,
    eventType: "processing_started",
    fromStatus: "processing",
    toStatus: "processing",
    message: "Asset handed to provider adapter boundary",
    payload: withCtx(params.ctx),
  });

  return claimed;
}

async function submitClaimedAssetToProvider(params: {
  admin: SupabaseClient;
  asset: VideoAssetRecord;
  ctx: WorkerContext;
}): Promise<void> {
  try {
    const submitted = await submitToProvider({ asset: params.asset });

    const { data: updated } = await params.admin
      .from("video_assets")
      .update({
        provider: submitted.provider,
        provider_job_id: submitted.providerJobId,
        provider_request_id: submitted.providerRequestId,
      })
      .eq("id", params.asset.id)
      .eq("status", "processing")
      .select("*")
      .maybeSingle();

    if (!updated) {
      await insertEvent({
        admin: params.admin,
        assetId: params.asset.id,
        eventType: "provider_submit_skipped",
        fromStatus: "processing",
        toStatus: "processing",
        message: "Provider submit succeeded but asset update was skipped",
        payload: withCtx(params.ctx, {
          provider: submitted.provider,
          providerJobId: submitted.providerJobId,
        }),
      });
      return;
    }

    await insertEvent({
      admin: params.admin,
      assetId: params.asset.id,
      eventType: "provider_submit_success",
      fromStatus: "processing",
      toStatus: "processing",
      message: "Provider job submission completed",
      payload: withCtx(params.ctx, {
        provider: submitted.provider,
        providerJobId: submitted.providerJobId,
        providerRequestId: submitted.providerRequestId,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Provider submit failed";

    await markTerminalFailure({
      admin: params.admin,
      assetId: params.asset.id,
      fromStatus: "processing",
      errorCode: "PROVIDER_SUBMIT_FAILED",
      errorMessage: message,
      context: params.ctx,
    });

    const { data: refreshed } = await params.admin
      .from("video_assets")
      .select("*")
      .eq("id", params.asset.id)
      .maybeSingle();

    const failedAsset = asAsset((refreshed ?? {}) as Record<string, unknown>);
    if (failedAsset) {
      await maybeScheduleAutoRetry({
        admin: params.admin,
        asset: failedAsset,
        context: params.ctx,
      });
    }
  }
}

export async function markTerminalFailure(params: {
  admin: SupabaseClient;
  assetId: string;
  fromStatus: VideoProcessingStatus;
  errorCode: string;
  errorMessage: string;
  context?: WorkerContext;
}): Promise<void> {
  if (!canTransitionStatus(params.fromStatus, "failed")) return;

  const { data } = await params.admin
    .from("video_assets")
    .update({
      status: "failed",
      error_code: params.errorCode,
      error_message: params.errorMessage,
    })
    .eq("id", params.assetId)
    .eq("status", params.fromStatus)
    .select("id")
    .maybeSingle();

  if (!data) return;

  await insertEvent({
    admin: params.admin,
    assetId: params.assetId,
    eventType: "terminal_failure_marked",
    fromStatus: params.fromStatus,
    toStatus: "failed",
    message: params.errorMessage,
    payload: withCtx(
      params.context ?? { trigger: "manual", reason: null, dispatchId: null },
      {
        errorCode: params.errorCode,
      },
    ),
  });
}

export async function maybeScheduleAutoRetry(params: {
  admin: SupabaseClient;
  asset: VideoAssetRecord;
  context: WorkerContext;
}): Promise<void> {
  if (params.asset.status !== "failed") return;

  if (!canAutoRetry(params.asset.attempt_count)) {
    await insertEvent({
      admin: params.admin,
      assetId: params.asset.id,
      eventType: "auto_retry_exhausted",
      fromStatus: "failed",
      toStatus: "failed",
      message: "Auto retry limit reached",
      payload: withCtx(params.context, {
        attemptCount: params.asset.attempt_count,
        maxAttempts: VIDEO_PIPELINE_MAX_RETRY_ATTEMPTS,
      }),
    });
    return;
  }

  if (!canTransitionStatus("failed", "retrying")) return;

  const retryEta = getRetryEtaIso(params.asset.attempt_count + 1);
  const retryDelayMs = Math.max(0, Date.parse(retryEta) - Date.now());

  const { data } = await params.admin
    .from("video_assets")
    .update({ status: "retrying" })
    .eq("id", params.asset.id)
    .eq("status", "failed")
    .select("id")
    .maybeSingle();

  if (!data) return;

  await insertEvent({
    admin: params.admin,
    assetId: params.asset.id,
    eventType: "auto_retry_scheduled",
    fromStatus: "failed",
    toStatus: "retrying",
    message: "Retry scheduled by backoff policy",
    payload: withCtx(params.context, {
      attemptCount: params.asset.attempt_count + 1,
      retryDelayMs,
      retryEta,
      maxAttempts: VIDEO_PIPELINE_MAX_RETRY_ATTEMPTS,
    }),
  });
}

export async function runOrchestrationCycle(params: {
  admin: SupabaseClient;
  assetId: string;
  preferredFromStatus: VideoProcessingStatus;
  context: WorkerContext;
}): Promise<{
  claimed: boolean;
  fromStatus: VideoProcessingStatus;
}> {
  const claimed = await claimAsset({
    admin: params.admin,
    assetId: params.assetId,
    fromStatus: params.preferredFromStatus,
    ctx: params.context,
  });

  if (claimed) {
    await submitClaimedAssetToProvider({
      admin: params.admin,
      asset: claimed,
      ctx: params.context,
    });
    return { claimed: true, fromStatus: params.preferredFromStatus };
  }

  const fallbackStatus: VideoProcessingStatus =
    params.preferredFromStatus === "retrying" ? "queued" : "retrying";

  const fallbackClaimed = await claimAsset({
    admin: params.admin,
    assetId: params.assetId,
    fromStatus: fallbackStatus,
    ctx: params.context,
  });

  if (fallbackClaimed) {
    await submitClaimedAssetToProvider({
      admin: params.admin,
      asset: fallbackClaimed,
      ctx: params.context,
    });
    return { claimed: true, fromStatus: fallbackStatus };
  }

  await insertEvent({
    admin: params.admin,
    assetId: params.assetId,
    eventType: "claim_skipped",
    fromStatus: params.preferredFromStatus,
    toStatus: params.preferredFromStatus,
    message: "Asset could not be claimed in this cycle",
    payload: withCtx(params.context),
  });

  return { claimed: false, fromStatus: params.preferredFromStatus };
}
