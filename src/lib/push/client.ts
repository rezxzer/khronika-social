"use client";

import { supabase } from "@/lib/supabase/client";

type PushRequestPayload = {
  conversationId?: string;
  recipientId?: string;
  type?: "message" | "reaction" | "comment" | "follow";
  link?: string;
  title?: string;
  body?: string;
};

function debugLog(context: string, details: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[push:${context}]`, details);
  }
}

export async function fireAndForgetPush(
  payload: PushRequestPayload,
  context: string,
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      debugLog(context, "skip: no session token");
      return;
    }

    const response = await fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as
        | { code?: string; error?: string }
        | null;
      debugLog(context, {
        status: response.status,
        code: json?.code,
        error: json?.error,
      });
      return;
    }

    const result = (await response.json().catch(() => null)) as
      | {
          sent?: number;
          attempted?: number;
          skipped?: boolean;
          mode?: string;
        }
      | null;
    debugLog(context, result ?? "ok");
  } catch (error) {
    debugLog(context, error);
  }
}
