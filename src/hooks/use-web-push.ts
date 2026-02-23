"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type PushState = "unsupported" | "default" | "denied" | "granted" | "subscribed";

export function useWebPush(userId: string | undefined) {
  const [state, setState] = useState<PushState>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const perm = Notification.permission;
    if (perm === "denied") {
      setState("denied");
      return;
    }

    if (perm === "granted") {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const { data } = await supabase
            .from("push_subscriptions")
            .select("id")
            .eq("user_id", userId)
            .eq("endpoint", sub.endpoint)
            .eq("is_active", true)
            .maybeSingle();
          setState(data ? "subscribed" : "granted");
        } else {
          setState("granted");
        }
      });
    } else {
      setState("default");
    }
  }, [userId]);

  const subscribe = useCallback(async () => {
    if (!userId) return false;
    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setLoading(false);
        return false;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );

      if (error) {
        setLoading(false);
        return false;
      }

      setState("subscribed");
      setLoading(false);
      return true;
    } catch {
      setLoading(false);
      return false;
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return false;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", sub.endpoint);

        await sub.unsubscribe();
      }

      setState("granted");
      setLoading(false);
      return true;
    } catch {
      setLoading(false);
      return false;
    }
  }, [userId]);

  return { state, loading, subscribe, unsubscribe };
}
