import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("circles")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!data) {
    return { title: "წრე" };
  }

  return {
    title: data.name,
    description: data.description || `${data.name} — წრე ქრონიკაში.`,
  };
}

export default function CircleLayout({ children }: Props) {
  return children;
}
