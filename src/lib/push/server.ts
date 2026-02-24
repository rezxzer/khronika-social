import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PushNotificationType = "message" | "reaction" | "comment" | "follow";

export interface PushRequestPayload {
  conversationId?: string;
  recipientId?: string;
  type?: PushNotificationType;
  link?: string;
  title?: string;
  body?: string;
}

export interface PushSendResult {
  ok: boolean;
  sent: number;
  attempted: number;
  deactivated: number;
  recipientId: string | null;
  skipped: boolean;
  mode: PushNotificationType | "custom";
  message?: string;
}

let vapidConfigured = false;

export function ensureVapid(): boolean {
  if (vapidConfigured) return true;

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@khronika.ge";

  if (!pub || !priv) return false;

  webpush.setVapidDetails(subject, pub, priv);
  vapidConfigured = true;
  return true;
}

export async function resolveRecipientId(
  admin: SupabaseClient,
  actorId: string,
  payload: PushRequestPayload,
): Promise<string | null> {
  if (payload.recipientId) return payload.recipientId;

  if (!payload.conversationId) return null;

  const { data: conv } = await admin
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", payload.conversationId)
    .single();

  if (!conv) return null;

  return conv.participant_1 === actorId ? conv.participant_2 : conv.participant_1;
}

export function buildPushContent(params: {
  actorName: string;
  payload: PushRequestPayload;
}): {
  mode: PushNotificationType | "custom";
  title: string;
  body: string;
  data: Record<string, string>;
} {
  const { actorName, payload } = params;

  if (payload.title && payload.body) {
    return {
      mode: payload.type ?? "custom",
      title: payload.title,
      body: payload.body,
      data: {
        type: payload.type ?? "custom",
        link: payload.link ?? "/notifications",
        ...(payload.conversationId ? { conversationId: payload.conversationId } : {}),
      },
    };
  }

  const type: PushNotificationType = payload.type ?? "message";

  if (type === "message") {
    const conversationLink = payload.conversationId
      ? `/messages/${payload.conversationId}`
      : "/messages";

    return {
      mode: "message",
      title: actorName,
      body: "ახალი პირადი მესიჯი",
      data: {
        type: "message",
        link: payload.link ?? conversationLink,
        ...(payload.conversationId ? { conversationId: payload.conversationId } : {}),
      },
    };
  }

  if (type === "reaction") {
    return {
      mode: "reaction",
      title: actorName,
      body: "რეაქცია დატოვა თქვენს პოსტზე",
      data: {
        type: "reaction",
        link: payload.link ?? "/notifications",
      },
    };
  }

  if (type === "comment") {
    return {
      mode: "comment",
      title: actorName,
      body: "დააკომენტარა თქვენი პოსტი",
      data: {
        type: "comment",
        link: payload.link ?? "/notifications",
      },
    };
  }

  return {
    mode: "follow",
    title: actorName,
    body: "გამოგიწერათ",
    data: {
      type: "follow",
      link: payload.link ?? "/notifications",
    },
  };
}

export async function sendPushToRecipient(params: {
  admin: SupabaseClient;
  recipientId: string;
  payload: { title: string; body: string; data: Record<string, string> };
  mode: PushNotificationType | "custom";
}): Promise<PushSendResult> {
  const { admin, recipientId, payload, mode } = params;

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", recipientId)
    .eq("is_active", true);

  if (!subscriptions || subscriptions.length === 0) {
    return {
      ok: true,
      sent: 0,
      attempted: 0,
      deactivated: 0,
      recipientId,
      skipped: true,
      mode,
      message: "No active subscriptions",
    };
  }

  const encodedPayload = JSON.stringify(payload);
  let sent = 0;
  const expiredIds: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        encodedPayload,
      );
      sent++;
    } catch (error: unknown) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        expiredIds.push(sub.id);
      }
    }
  }

  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("id", expiredIds);
  }

  return {
    ok: true,
    sent,
    attempted: subscriptions.length,
    deactivated: expiredIds.length,
    recipientId,
    skipped: false,
    mode,
  };
}
