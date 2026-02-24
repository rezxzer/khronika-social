import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "სერვერის კონფიგურაცია არასწორია" },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const uid = user.id;

  try {
    const steps: Array<{ name: string; run: () => Promise<{ error: { message: string } | null }> }> = [
      {
        name: "push_subscriptions",
        run: async () => {
          const { error } = await adminClient
            .from("push_subscriptions")
            .delete()
            .eq("user_id", uid);
          return { error };
        },
      },
      {
        name: "messages",
        run: async () => {
          const { error } = await adminClient.from("messages").delete().eq("sender_id", uid);
          return { error };
        },
      },
      {
        name: "conversations",
        run: async () => {
          const { error } = await adminClient
            .from("conversations")
            .delete()
            .or(`participant_1.eq.${uid},participant_2.eq.${uid}`);
          return { error };
        },
      },
      {
        name: "notifications",
        run: async () => {
          const { error } = await adminClient
            .from("notifications")
            .delete()
            .or(`user_id.eq.${uid},actor_id.eq.${uid}`);
          return { error };
        },
      },
      {
        name: "reports",
        run: async () => {
          const { error } = await adminClient
            .from("reports")
            .delete()
            .eq("reporter_id", uid);
          return { error };
        },
      },
      {
        name: "reactions",
        run: async () => {
          const { error } = await adminClient.from("reactions").delete().eq("user_id", uid);
          return { error };
        },
      },
      {
        name: "comments",
        run: async () => {
          const { error } = await adminClient.from("comments").delete().eq("author_id", uid);
          return { error };
        },
      },
      {
        name: "posts",
        run: async () => {
          const { error } = await adminClient.from("posts").delete().eq("author_id", uid);
          return { error };
        },
      },
      {
        name: "circle_members",
        run: async () => {
          const { error } = await adminClient
            .from("circle_members")
            .delete()
            .eq("user_id", uid);
          return { error };
        },
      },
      {
        name: "follows",
        run: async () => {
          const { error } = await adminClient
            .from("follows")
            .delete()
            .or(`follower_id.eq.${uid},following_id.eq.${uid}`);
          return { error };
        },
      },
      {
        name: "blocklist",
        run: async () => {
          const { error } = await adminClient
            .from("blocklist")
            .delete()
            .or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`);
          return { error };
        },
      },
      {
        name: "profiles",
        run: async () => {
          const { error } = await adminClient.from("profiles").delete().eq("id", uid);
          return { error };
        },
      },
    ];

    for (const step of steps) {
      const { error } = await step.run();
      if (error) {
        return NextResponse.json(
          {
            error: `წაშლა ვერ დასრულდა (${step.name}): ${error.message}`,
          },
          { status: 500 },
        );
      }
    }

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
