import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildPushContent,
  ensureVapid,
  resolveRecipientId,
  sendPushToRecipient,
  type PushRequestPayload,
} from "@/lib/push/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const token = authHeader.split(" ")[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || !ensureVapid()) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured", code: "SERVER_MISCONFIGURED" },
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
      { ok: false, error: "Invalid token", code: "INVALID_TOKEN" },
      { status: 401 },
    );
  }

  let body: PushRequestPayload;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { ok: false, error: "Bad request", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }
    body = parsed as PushRequestPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Bad request", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const recipientId = await resolveRecipientId(admin, user.id, body);
  if (!recipientId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing recipient target",
        code: "MISSING_RECIPIENT",
      },
      { status: 400 },
    );
  }

  if (recipientId === user.id) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      attempted: 0,
      deactivated: 0,
      recipientId,
      skipped: true,
      mode: body.type ?? (body.conversationId ? "message" : "custom"),
      message: "Self-notification skipped",
    });
  }

  const { data: senderProfile } = await admin
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  const senderName =
    senderProfile?.display_name || senderProfile?.username || "მომხმარებელი";

  const content = buildPushContent({
    actorName: senderName,
    payload: body,
  });

  const result = await sendPushToRecipient({
    admin,
    recipientId,
    payload: {
      title: content.title,
      body: content.body,
      data: content.data,
    },
    mode: content.mode,
  });

  return NextResponse.json(result);
}
