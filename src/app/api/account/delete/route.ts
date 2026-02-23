import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
      { status: 500 },
    );
  }

  const adminClient = createClient(url, serviceKey);

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const uid = user.id;

  try {
    await adminClient.from("reactions").delete().eq("user_id", uid);
    await adminClient.from("comments").delete().eq("author_id", uid);
    await adminClient.from("posts").delete().eq("author_id", uid);
    await adminClient.from("circle_members").delete().eq("user_id", uid);
    await adminClient.from("follows").delete().or(`follower_id.eq.${uid},following_id.eq.${uid}`);
    await adminClient.from("blocklist").delete().or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
    await adminClient.from("reports").delete().eq("reporter_id", uid);
    await adminClient.from("notifications").delete().or(`user_id.eq.${uid},actor_id.eq.${uid}`);
    await adminClient.from("profiles").delete().eq("id", uid);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteError) {
      return NextResponse.json(
        { error: "Auth deletion failed: " + deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
