"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { Plus, Search, Lock, Globe, Users, CircleDot, Compass } from "lucide-react";

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
    <AppShell>
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">წრეები</h1>
          <p className="text-sm text-muted-foreground">იპოვე ან შექმენი შენი წრე</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/circles/explore">
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline">აღმოაჩინე</span>
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/circles/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">შექმნა</span>
            </Link>
          </Button>
        </div>
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
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CircleDot className="h-6 w-6" />
          </div>
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
          {filtered.map((circle) => {
            const accent = getCircleAccent(circle.slug);
            return (
              <Link
                key={circle.id}
                href={`/c/${circle.slug}`}
                className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={accent.stripStyle}
                />
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={accent.chipStyle}
                  >
                    <CircleDot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold group-hover:underline">
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
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{circle.member_count} წევრი</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </AppShell>
  );
}
