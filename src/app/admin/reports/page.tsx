"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { ReportsList, type Report } from "@/components/admin/reports-list";
import { Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const fetchReports = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setDenied(true);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/reports", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (res.status === 403 || res.status === 401) {
      setDenied(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchReports();
  }, [authLoading, user, router, fetchReports]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (denied || !user) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Shield className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-xl font-bold">არ გაქვს წვდომა</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ეს გვერდი მხოლოდ ადმინისტრატორებისთვისაა.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-seal-muted">
          <Shield className="h-5 w-5 text-seal" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">
            რეპორტები
          </h1>
          <p className="text-xs text-muted-foreground">
            {reports.length} რეპორტი სულ
          </p>
        </div>
      </div>

      <ReportsList reports={reports} />
    </div>
  );
}
