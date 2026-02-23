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
type PushActionResult = { ok: true } | { ok: false; message: string };

export function useWebPush(userId: string | undefined) {
  const [state, setState] = useState<PushState>("default");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  function getVapidKey() {
    const raw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!raw) return null;
    return raw.replace(/\s+/g, "");
  }

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

  const subscribe = useCallback(async (): Promise<PushActionResult> => {
    if (!userId) return { ok: false, message: "მომხმარებელი ვერ მოიძებნა" };
    setLoading(true);
    setLastError(null);

    try {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setState("unsupported");
        setLoading(false);
        const message = "ეს ბრაუზერი push შეტყობინებებს არ უჭერს მხარს";
        setLastError(message);
        return { ok: false, message };
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        setLoading(false);
        const message = "ბრაუზერში შეტყობინებების ნებართვა არ არის ჩართული";
        setLastError(message);
        return { ok: false, message };
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = getVapidKey();
      if (!vapidKey) {
        setLoading(false);
        const message = "NEXT_PUBLIC_VAPID_PUBLIC_KEY ვერ მოიძებნა";
        setLastError(message);
        return { ok: false, message };
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const appServerKey = Uint8Array.from(urlBase64ToUint8Array(vapidKey));
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as unknown as BufferSource,
        });
      }

      const json = sub.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        setLoading(false);
        const message = "Push subscription data არასრულია";
        setLastError(message);
        return { ok: false, message };
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint,
          p256dh,
          auth,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );

      if (error) {
        setLoading(false);
        const message = `Subscription შენახვა ვერ მოხერხდა: ${error.message}`;
        setLastError(message);
        return { ok: false, message };
      }

      setState("subscribed");
      setLoading(false);
      return { ok: true };
    } catch (err) {
      setLoading(false);
      const domErr = err as DOMException;
      const message =
        domErr?.name === "InvalidCharacterError"
          ? "VAPID public key არასწორი ფორმატისაა"
          : domErr?.name === "NotAllowedError"
            ? "ბრაუზერმა Push subscription დაბლოკა"
            : "Push subscription ვერ შეიქმნა";
      setLastError(message);
      return { ok: false, message };
    }
  }, [userId]);

  const unsubscribe = useCallback(async (): Promise<PushActionResult> => {
    if (!userId) return { ok: false, message: "მომხმარებელი ვერ მოიძებნა" };
    setLoading(true);
    setLastError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const { error } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", sub.endpoint);
        if (error) {
          setLoading(false);
          const message = `Subscription წაშლა ვერ მოხერხდა: ${error.message}`;
          setLastError(message);
          return { ok: false, message };
        }

        await sub.unsubscribe();
      }

      setState("granted");
      setLoading(false);
      return { ok: true };
    } catch {
      setLoading(false);
      const message = "Push subscription გამორთვა ვერ მოხერხდა";
      setLastError(message);
      return { ok: false, message };
    }
  }, [userId]);

  return { state, loading, subscribe, unsubscribe, lastError };
}
