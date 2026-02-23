import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminServer } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const adminClient = createClient(url, serviceKey);

  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(token);

  if (error || !user || !isAdminServer(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: reports } = await adminClient
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (reports || []) as {
    id: string;
    reporter_id: string;
    target_type: string;
    target_id: string;
    reason: string | null;
    created_at: string;
  }[];

  const reporterIds = [...new Set(rows.map((r) => r.reporter_id))];
  let profileMap: Record<
    string,
    { username: string | null; display_name: string | null }
  > = {};

  if (reporterIds.length > 0) {
    const { data: profiles } = await adminClient
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

  const enrichedReports = rows.map((r) => ({
    ...r,
    reporter: profileMap[r.reporter_id] || null,
  }));

  return NextResponse.json({ reports: enrichedReports });
}
