import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildVideoAssetContractData } from "@/lib/video-pipeline/contracts";
import type { VideoAssetRecord } from "@/lib/video-pipeline/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  if (!UUID_RE.test(postId)) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "Invalid post id" },
      { status: 400 },
    );
  }

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

  const { data: asset } = await admin
    .from("video_assets")
    .select("*")
    .eq("post_id", postId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!asset) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", error: "Video asset not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: buildVideoAssetContractData({ record: asset as VideoAssetRecord }),
  });
}
