"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  ExternalLink,
  CheckCircle2,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
  reporter?: {
    username: string | null;
    display_name: string | null;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ახლახანს";
  if (mins < 60) return `${mins}წთ`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}სთ`;
  const days = Math.floor(hours / 24);
  return `${days}დ`;
}

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const admin = isAdmin(user?.id);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select(
        "id, reporter_id, target_type, target_id, reason, created_at, reporter:reporter_id(username, display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setReports(data as unknown as Report[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin(user.id)) return;
    fetchReports();
  }, [authLoading, user, router, fetchReports]);

  async function handleBlock(reporterUserId: string, targetAuthorId: string) {
    if (!user) return;
    const { error } = await supabase.from("blocklist").insert({
      blocker_id: user.id,
      blocked_id: targetAuthorId,
    });
    if (error) {
      if (error.code === "23505") {
        toast.info("უკვე დაბლოკილია");
      } else {
        toast.error("დაბლოკვა ვერ მოხერხდა");
      }
    } else {
      toast.success("ავტორი დაიბლოკა");
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || !admin) {
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
          <h1 className="font-serif text-xl font-bold sm:text-2xl">რეპორტები</h1>
          <p className="text-xs text-muted-foreground">
            {reports.length} რეპორტი სულ
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <CheckCircle2 className="mb-3 h-8 w-8" />
          <p className="font-medium">რეპორტები არ არის</p>
          <p className="mt-1 text-sm">ყველაფერი წესრიგშია!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const reviewed = reviewedIds.has(r.id);
            const reporterName =
              r.reporter?.display_name || r.reporter?.username || "უცნობი";

            const targetLink =
              r.target_type === "post"
                ? `/p/${r.target_id}`
                : r.target_type === "comment"
                  ? `/p/${r.target_id}`
                  : "#";

            return (
              <div
                key={r.id}
                className={`rounded-xl border bg-card p-3 transition-opacity sm:p-4 ${reviewed ? "opacity-50" : ""}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {r.target_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(r.created_at)}
                      </span>
                      {reviewed && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          განხილული
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{reporterName}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {r.reason || "მიზეზი არ მითითებულა"}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={targetLink}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">ნახვა</span>
                      </Link>
                    </Button>
                    {!reviewed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReviewedIds((prev) => new Set(prev).add(r.id))
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">განხილული</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlock(r.reporter_id, r.target_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">დაბლოკე</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
