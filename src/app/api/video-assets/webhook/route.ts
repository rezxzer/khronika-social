import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canTransitionStatus } from "@/lib/video-pipeline/status";
import { verifyAndNormalizeCallback } from "@/lib/video-pipeline/provider-adapter";
import type { VideoAssetRecord } from "@/lib/video-pipeline/types";

export const dynamic = "force-dynamic";

async function insertEvent(params: {
  admin: any;
  assetId: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
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

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_MISCONFIGURED",
        error: "Server misconfigured",
      },
      { status: 500 },
    );
  }

  const admin = createClient(url, serviceKey);
  const rawBody = await request.text();

  let callback;
  try {
    callback = await verifyAndNormalizeCallback({
      admin,
      headers: request.headers,
      rawBody,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook verification failed";
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: message },
      { status: 400 },
    );
  }

  const { data: asset } = await admin
    .from("video_assets")
    .select("*")
    .eq("provider_job_id", callback.providerJobId)
    .maybeSingle();

  if (!asset) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_FOUND",
        error: "Video asset not found for provider job",
      },
      { status: 404 },
    );
  }

  const current = asset as VideoAssetRecord;

  if (callback.replayDetected) {
    await insertEvent({
      admin,
      assetId: current.id,
      eventType: "webhook_replay_skipped",
      fromStatus: current.status,
      toStatus: current.status,
      message: "Replay callback skipped by nonce protection",
      payload: {
        nonce: callback.nonce,
        providerEventId: callback.providerEventId,
      },
    });
    return NextResponse.json({
      ok: true,
      duplicate: true,
      skipped: true,
    });
  }

  if (callback.providerEventId) {
    const { data: processed } = await admin
      .from("video_processing_events")
      .select("id")
      .eq("video_asset_id", current.id)
      .eq("event_type", "webhook_event_processed")
      .contains("payload", { providerEventId: callback.providerEventId })
      .maybeSingle();

    if (processed) {
      await insertEvent({
        admin,
        assetId: current.id,
        eventType: "webhook_duplicate_skipped",
        fromStatus: current.status,
        toStatus: current.status,
        message: "Duplicate provider event id skipped",
        payload: {
          providerEventId: callback.providerEventId,
          nonce: callback.nonce,
        },
      });
      return NextResponse.json({
        ok: true,
        duplicate: true,
        skipped: true,
      });
    }
  }

  await insertEvent({
    admin,
    assetId: current.id,
    eventType: "webhook_nonce_accepted",
    fromStatus: current.status,
    toStatus: current.status,
    message: "Webhook signature and replay checks passed",
    payload: {
      nonce: callback.nonce,
      timestampMs: callback.timestampMs,
      providerEventId: callback.providerEventId,
    },
  });

  if (
    callback.internalStatus !== current.status &&
    !canTransitionStatus(current.status, callback.internalStatus)
  ) {
    await insertEvent({
      admin,
      assetId: current.id,
      eventType: "webhook_invalid_transition",
      fromStatus: current.status,
      toStatus: callback.internalStatus,
      message: "Callback transition rejected by status guard",
      payload: {
        externalStatus: callback.externalStatus,
        providerEventId: callback.providerEventId,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_STATE",
        error: "Invalid status transition",
      },
      { status: 409 },
    );
  }

  const updatePayload: Record<string, unknown> = {
    status: callback.internalStatus,
    provider: callback.provider,
    provider_request_id: callback.providerRequestId ?? current.provider_request_id,
  };

  if (callback.output.manifestUrl !== null) {
    updatePayload.manifest_url = callback.output.manifestUrl;
  }
  if (callback.output.progressiveUrl !== null) {
    updatePayload.progressive_url = callback.output.progressiveUrl;
  }
  if (callback.output.posterUrl !== null) {
    updatePayload.poster_url = callback.output.posterUrl;
  }
  if (callback.output.thumbnailUrl !== null) {
    updatePayload.thumbnail_url = callback.output.thumbnailUrl;
  }
  if (callback.output.durationSec !== null) {
    updatePayload.duration_sec = callback.output.durationSec;
  }
  if (callback.output.width !== null) {
    updatePayload.width = callback.output.width;
  }
  if (callback.output.height !== null) {
    updatePayload.height = callback.output.height;
  }
  if (callback.output.bitrateKbps !== null) {
    updatePayload.bitrate_kbps = callback.output.bitrateKbps;
  }
  if (callback.error.code !== null || callback.error.message !== null) {
    updatePayload.error_code = callback.error.code;
    updatePayload.error_message = callback.error.message;
  } else if (callback.internalStatus === "ready") {
    updatePayload.error_code = null;
    updatePayload.error_message = null;
    updatePayload.completed_at = new Date().toISOString();
  }

  const { data: updated } = await admin
    .from("video_assets")
    .update(updatePayload)
    .eq("id", current.id)
    .eq("status", current.status)
    .select("id, status")
    .maybeSingle();

  if (!updated) {
    await insertEvent({
      admin,
      assetId: current.id,
      eventType: "webhook_race_skipped",
      fromStatus: current.status,
      toStatus: callback.internalStatus,
      message: "Callback update skipped due to concurrent status change",
      payload: {
        providerEventId: callback.providerEventId,
      },
    });
    return NextResponse.json({
      ok: true,
      duplicate: true,
      skipped: true,
    });
  }

  await insertEvent({
    admin,
    assetId: current.id,
    eventType: "webhook_event_processed",
    fromStatus: current.status,
    toStatus: callback.internalStatus,
    message: "Webhook callback applied to video asset",
    payload: {
      providerEventId: callback.providerEventId,
      externalStatus: callback.externalStatus,
      output: callback.output,
      error: callback.error,
    },
  });

  return NextResponse.json({
    ok: true,
    applied: true,
    status: callback.internalStatus,
  });
}
