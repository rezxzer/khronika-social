import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface PushPreferencesResponseData {
  reactionEnabled: boolean;
  commentEnabled: boolean;
  followEnabled: boolean;
}

interface PushPreferencesWriteBody {
  reactionEnabled?: unknown;
  commentEnabled?: unknown;
  followEnabled?: unknown;
}

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] ?? null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

async function getAdminClientAndUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { error: "SERVER_MISCONFIGURED" as const };
  }

  const admin = createClient(url, serviceKey);
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);

  if (authError || !user) {
    return { error: "INVALID_TOKEN" as const };
  }

  return { admin, userId: user.id };
}

function rowToResponseData(row?: {
  reaction_enabled?: boolean | null;
  comment_enabled?: boolean | null;
  follow_enabled?: boolean | null;
} | null): PushPreferencesResponseData {
  return {
    reactionEnabled: row?.reaction_enabled ?? true,
    commentEnabled: row?.comment_enabled ?? true,
    followEnabled: row?.follow_enabled ?? true,
  };
}

export async function GET(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const auth = await getAdminClientAndUser(token);
  if (auth.error === "SERVER_MISCONFIGURED") {
    return NextResponse.json(
      { ok: false, code: "SERVER_MISCONFIGURED", error: "Server misconfigured" },
      { status: 500 },
    );
  }
  if (auth.error === "INVALID_TOKEN") {
    return NextResponse.json(
      { ok: false, code: "INVALID_TOKEN", error: "Invalid token" },
      { status: 401 },
    );
  }

  const { data: row } = await auth.admin
    .from("push_notification_preferences")
    .select("reaction_enabled, comment_enabled, follow_enabled")
    .eq("user_id", auth.userId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    data: rowToResponseData(row),
  });
}

export async function PUT(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHORIZED", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const auth = await getAdminClientAndUser(token);
  if (auth.error === "SERVER_MISCONFIGURED") {
    return NextResponse.json(
      { ok: false, code: "SERVER_MISCONFIGURED", error: "Server misconfigured" },
      { status: 500 },
    );
  }
  if (auth.error === "INVALID_TOKEN") {
    return NextResponse.json(
      { ok: false, code: "INVALID_TOKEN", error: "Invalid token" },
      { status: 401 },
    );
  }

  let body: PushPreferencesWriteBody;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { ok: false, code: "BAD_REQUEST", error: "Bad request" },
        { status: 400 },
      );
    }
    body = parsed as PushPreferencesWriteBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "Bad request" },
      { status: 400 },
    );
  }

  const hasReaction = body.reactionEnabled !== undefined;
  const hasComment = body.commentEnabled !== undefined;
  const hasFollow = body.followEnabled !== undefined;
  if (!hasReaction && !hasComment && !hasFollow) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "No preference fields provided" },
      { status: 400 },
    );
  }

  if (
    (hasReaction && !isBoolean(body.reactionEnabled)) ||
    (hasComment && !isBoolean(body.commentEnabled)) ||
    (hasFollow && !isBoolean(body.followEnabled))
  ) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", error: "Preference fields must be boolean" },
      { status: 400 },
    );
  }

  const { data: existing } = await auth.admin
    .from("push_notification_preferences")
    .select("reaction_enabled, comment_enabled, follow_enabled")
    .eq("user_id", auth.userId)
    .maybeSingle();

  const base = rowToResponseData(existing);
  const next: PushPreferencesResponseData = {
    reactionEnabled: hasReaction ? (body.reactionEnabled as boolean) : base.reactionEnabled,
    commentEnabled: hasComment ? (body.commentEnabled as boolean) : base.commentEnabled,
    followEnabled: hasFollow ? (body.followEnabled as boolean) : base.followEnabled,
  };

  const { data: saved, error: saveError } = await auth.admin
    .from("push_notification_preferences")
    .upsert(
      {
        user_id: auth.userId,
        reaction_enabled: next.reactionEnabled,
        comment_enabled: next.commentEnabled,
        follow_enabled: next.followEnabled,
      },
      { onConflict: "user_id" },
    )
    .select("reaction_enabled, comment_enabled, follow_enabled")
    .single();

  if (saveError) {
    return NextResponse.json(
      { ok: false, code: "SAVE_FAILED", error: "Failed to save push preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: rowToResponseData(saved),
  });
}
