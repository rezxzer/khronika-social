import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("posts")
    .select("content, profiles:author_id(display_name, username)")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "პოსტი" };
  }

  const author = data.profiles as unknown as { display_name: string | null; username: string | null };
  const authorName = author?.display_name || author?.username || "მომხმარებელი";
  const snippet = data.content?.slice(0, 120) || "";

  return {
    title: `${authorName} — პოსტი`,
    description: snippet,
  };
}

export default function PostLayout({ children }: Props) {
  return children;
}
