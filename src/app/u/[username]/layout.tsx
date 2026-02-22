import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username, bio")
    .eq("username", username)
    .single();

  if (!data) {
    return { title: "პროფილი" };
  }

  const name = data.display_name || data.username || username;

  return {
    title: `${name} (@${data.username})`,
    description: data.bio || `${name} — ქრონიკის მომხმარებელი.`,
  };
}

export default function UserLayout({ children }: Props) {
  return children;
}
