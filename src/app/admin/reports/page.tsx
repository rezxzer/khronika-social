import { createAdminClient } from "@/lib/supabase/server";
import { ReportsList, type Report } from "@/components/admin/reports-list";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
}

export default async function AdminReportsPage() {
  const admin = createAdminClient();

  const { data: reports } = await admin
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (reports || []) as ReportRow[];

  const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
  let profileMap: Record<
    string,
    { username: string | null; display_name: string | null }
  > = {};

  if (reporterIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username, display_name")
      .in("id", reporterIds);

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [
          p.id,
          { username: p.username, display_name: p.display_name },
        ])
      );
    }
  }

  const enrichedReports: Report[] = rows.map((r) => ({
    ...r,
    reporter: profileMap[r.reporter_id] || null,
  }));

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
            {enrichedReports.length} რეპორტი სულ
          </p>
        </div>
      </div>

      <ReportsList reports={enrichedReports} />
    </div>
  );
}
