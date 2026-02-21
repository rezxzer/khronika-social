"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Lock, Globe, Users } from "lucide-react";

interface Circle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  member_count: number;
}

export default function CirclesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchCircles() {
      setLoading(true);

      const { data, error } = await supabase
        .from("circles")
        .select("id, name, slug, description, is_private, created_at, circle_members(count)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          is_private: c.is_private,
          created_at: c.created_at,
          member_count:
            (c.circle_members as unknown as { count: number }[])?.[0]?.count ?? 0,
        }));
        setCircles(mapped);
      }

      setLoading(false);
    }

    fetchCircles();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  const filtered = circles.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">წრეები</h1>
          <p className="text-muted-foreground">იპოვე ან შექმენი შენი წრე</p>
        </div>
        <Button asChild>
          <Link href="/circles/new">
            <Plus className="h-4 w-4" />
            შექმნა
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="მოძებნე წრე..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">
            {search ? "ვერ მოიძებნა" : "ჯერ წრეები არ არის"}
          </p>
          <p className="mt-1 text-sm">
            {search
              ? "სცადე სხვა საძიებო სიტყვა"
              : "შექმენი პირველი წრე!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((circle) => (
            <Link
              key={circle.id}
              href={`/c/${circle.slug}`}
              className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold group-hover:underline">
                  {circle.name}
                </h3>
                <Badge variant={circle.is_private ? "secondary" : "outline"}>
                  {circle.is_private ? (
                    <Lock className="mr-1 h-3 w-3" />
                  ) : (
                    <Globe className="mr-1 h-3 w-3" />
                  )}
                  {circle.is_private ? "პირადი" : "ღია"}
                </Badge>
              </div>
              {circle.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {circle.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{circle.member_count} წევრი</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
