"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function handle() {
      const code = searchParams.get("code");

      if (process.env.NODE_ENV === "development") {
        console.log("[auth/callback] URL:", window.location.href);
        console.log("[auth/callback] code param:", code);
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (process.env.NODE_ENV === "development") {
          console.log("[auth/callback] exchangeCodeForSession error:", error);
        }

        if (!error) {
          router.replace("/feed");
          return;
        }

        toast.error("ავტორიზაცია ვერ მოხერხდა, სცადე თავიდან");
        router.replace("/login");
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (process.env.NODE_ENV === "development") {
        console.log("[auth/callback] getSession:", !!data.session);
      }

      if (data.session) {
        router.replace("/feed");
        return;
      }

      toast.error("ავტორიზაცია ვერ მოხერხდა");
      router.replace("/login");
    }

    handle();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-seal" />
      <p className="text-sm text-muted-foreground">მიმდინარეობს შესვლა...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-seal" />
          <p className="text-sm text-muted-foreground">მიმდინარეობს შესვლა...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
