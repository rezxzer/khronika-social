import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildVideoAssetContractData,
  parseRetryVideoAssetRequest,
} from "@/lib/video-pipeline/contracts";
import { dispatchVideoAssetJob } from "@/lib/video-pipeline/queue";
import { isRetryAllowed } from "@/lib/video-pipeline/status";
import type { VideoAssetRecord } from "@/lib/video-pipeline/types";

export const dynamic = "force-dynamic";

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] ?? null;
}

export async function POST(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", error: "Unauthorized" },
      { status: 401 },
    );
  }

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
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json(
      { ok: false, code: "INVALID_TOKEN", error: "Invalid token" },
      { status: 401 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "Bad request" },
      { status: 400 },
    );
  }

  const payload = parseRetryVideoAssetRequest(parsedBody);
  if (!payload) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "Bad request" },
      { status: 400 },
    );
  }

  const { data: asset } = await admin
    .from("video_assets")
    .select("*")
    .eq("id", payload.assetId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!asset) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", error: "Video asset not found" },
      { status: 404 },
    );
  }

  const current = asset as VideoAssetRecord;
  if (!isRetryAllowed(current.status)) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_STATE",
        error: "Retry is not allowed for this status",
      },
      { status: 409 },
    );
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("video_assets")
    .update({
      status: "retrying",
      last_attempt_at: nowIso,
      error_code: null,
      error_message: null,
    })
    .eq("id", payload.assetId)
    .eq("owner_id", user.id)
    .eq("status", current.status)
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    const { data: latest } = await admin
      .from("video_assets")
      .select("status")
      .eq("id", payload.assetId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (latest && latest.status !== current.status) {
      await admin.from("video_processing_events").insert({
        video_asset_id: payload.assetId,
        event_type: "retry_conflict",
        from_status: current.status,
        to_status: latest.status,
        message: "Retry request conflicted with concurrent status update",
        payload: payload.reason ? { reason: payload.reason } : {},
      });

      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_STATE",
          error: "Retry state changed, refresh and try again",
          details: `Current status: ${latest.status}`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        error: "Failed to request retry",
      },
      { status: 500 },
    );
  }

  await admin.from("video_processing_events").insert({
    video_asset_id: payload.assetId,
    event_type: "retry_requested",
    from_status: current.status,
    to_status: "retrying",
    message: payload.reason ?? null,
    payload: payload.reason ? { reason: payload.reason } : {},
  });

  void dispatchVideoAssetJob({
    admin,
    assetId: payload.assetId,
    trigger: "retry",
    preferredFromStatus: "retrying",
    reason: payload.reason ?? "manual retry request",
  }).catch((error) => {
    console.error("[video-assets:retry] dispatch failed:", error);
  });

  return NextResponse.json({
    ok: true,
    data: buildVideoAssetContractData({
      record: updated as VideoAssetRecord,
      idempotent: false,
    }),
  });
}
