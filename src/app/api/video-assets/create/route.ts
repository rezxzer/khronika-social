import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildVideoAssetContractData,
  parseCreateVideoAssetRequest,
} from "@/lib/video-pipeline/contracts";
import { dispatchVideoAssetJob } from "@/lib/video-pipeline/queue";
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

  const payload = parseCreateVideoAssetRequest(parsedBody);
  if (!payload) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "Bad request" },
      { status: 400 },
    );
  }

  const { data: post } = await admin
    .from("posts")
    .select("id, author_id")
    .eq("id", payload.postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", error: "Post not found" },
      { status: 404 },
    );
  }

  if (post.author_id !== user.id) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", error: "Forbidden" },
      { status: 403 },
    );
  }

  const { data: existing } = await admin
    .from("video_assets")
    .select("*")
    .eq("post_id", payload.postId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    void dispatchVideoAssetJob({
      admin,
      assetId: (existing as VideoAssetRecord).id,
      trigger: "create",
      preferredFromStatus: "queued",
      reason: "existing asset dispatch request",
    }).catch((error) => {
      console.error("[video-assets:create] dispatch existing failed:", error);
    });

    return NextResponse.json({
      ok: true,
      data: buildVideoAssetContractData({
        record: existing as VideoAssetRecord,
        idempotent: true,
      }),
    });
  }

  const { data: created, error: createError } = await admin
    .from("video_assets")
    .insert({
      post_id: payload.postId,
      owner_id: user.id,
      source_url: payload.sourceUrl,
      source_storage_path: payload.sourceStoragePath,
      provider_request_id: payload.providerRequestId,
      status: "queued",
    })
    .select("*")
    .single();

  if (createError || !created) {
    return NextResponse.json(
      {
        ok: false,
        code: "INTERNAL_ERROR",
        error: "Failed to create video asset",
      },
      { status: 500 },
    );
  }

  await admin.from("video_processing_events").insert({
    video_asset_id: (created as VideoAssetRecord).id,
    event_type: "job_queued",
    from_status: "uploading",
    to_status: "queued",
    message: "Asset registered and queued from create endpoint",
    payload: {
      trigger: "create",
    },
  });

  void dispatchVideoAssetJob({
    admin,
    assetId: (created as VideoAssetRecord).id,
    trigger: "create",
    preferredFromStatus: "queued",
    reason: "new asset dispatch request",
  }).catch((error) => {
    console.error("[video-assets:create] dispatch new failed:", error);
  });

  return NextResponse.json(
    {
      ok: true,
      data: buildVideoAssetContractData({
        record: created as VideoAssetRecord,
        idempotent: false,
      }),
    },
    { status: 201 },
  );
}
