"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowLeft,
  CircleDot,
  Users,
  Globe,
  Lock,
  Loader2,
  TrendingUp,
  Crown,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ExploreCircle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  member_count: number;
  post_count_week: number;
}

export default function ExploreCirclesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [popular, setPopular] = useState<ExploreCircle[]>([]);
  const [active, setActive] = useState<ExploreCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [circlesRes, membershipsRes, postsRes] = await Promise.all([
      supabase
        .from("circles")
        .select("id, name, slug, description, is_private, circle_members(count)"),
      supabase
        .from("circle_members")
        .select("circle_id")
        .eq("user_id", user.id),
      supabase
        .from("posts")
        .select("circle_id")
        .gte("created_at", weekAgo),
    ]);

    const myCircleIds = new Set(membershipsRes.data?.map((m) => m.circle_id) ?? []);
    setJoinedIds(myCircleIds);

    const weekPostCounts = new Map<string, number>();
    if (postsRes.data) {
      for (const p of postsRes.data) {
        weekPostCounts.set(p.circle_id, (weekPostCounts.get(p.circle_id) ?? 0) + 1);
      }
    }

    if (circlesRes.data) {
      const mapped: ExploreCircle[] = circlesRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        is_private: c.is_private,
        member_count:
          (c.circle_members as unknown as { count: number }[])?.[0]?.count ?? 0,
        post_count_week: weekPostCounts.get(c.id) ?? 0,
      }));

      const byMembers = [...mapped].sort((a, b) => b.member_count - a.member_count).slice(0, 8);
      const byActivity = [...mapped]
        .filter((c) => c.post_count_week > 0)
        .sort((a, b) => b.post_count_week - a.post_count_week)
        .slice(0, 8);

      setPopular(byMembers);
      setActive(byActivity);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  async function handleJoin(circleId: string) {
    if (!user || joiningId) return;
    setJoiningId(circleId);

    const { error } = await supabase.from("circle_members").insert({
      circle_id: circleId,
      user_id: user.id,
      role: "member",
    });

    if (!error) {
      setJoinedIds((prev) => new Set([...prev, circleId]));
      toast.success("წრეს შეუერთდი!");
    } else if (error.code === "23505") {
      setJoinedIds((prev) => new Set([...prev, circleId]));
    } else {
      toast.error("შეერთება ვერ მოხერხდა");
    }

    setJoiningId(null);
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/circles">
              <ArrowLeft className="h-4 w-4" />
              წრეებზე დაბრუნება
            </Link>
          </Button>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">აღმოაჩინე წრეები</h1>
          <p className="text-sm text-muted-foreground">
            იპოვე საინტერესო წრეები და შეუერთდი თემებს
          </p>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div>
              <Skeleton className="mb-3 h-5 w-40" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Popular */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-seal" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  პოპულარული წრეები
                </h2>
              </div>

              {popular.length === 0 ? (
                <EmptySection message="ჯერ წრეები არ შექმნილა" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {popular.map((circle) => (
                    <CircleCard
                      key={circle.id}
                      circle={circle}
                      joined={joinedIds.has(circle.id)}
                      joining={joiningId === circle.id}
                      onJoin={() => handleJoin(circle.id)}
                      metric={`${circle.member_count} წევრი`}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Active This Week */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-seal" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  აქტიური ამ კვირაში
                </h2>
              </div>

              {active.length === 0 ? (
                <EmptySection message="ამ კვირაში ჯერ პოსტები არ დაწერილა" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {active.map((circle) => (
                    <CircleCard
                      key={circle.id}
                      circle={circle}
                      joined={joinedIds.has(circle.id)}
                      joining={joiningId === circle.id}
                      onJoin={() => handleJoin(circle.id)}
                      metric={`${circle.post_count_week} პოსტი ამ კვირაში`}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-seal/20 bg-seal-light/30 py-10 text-center">
      <Sparkles className="mb-2 h-8 w-8 text-seal/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function CircleCard({
  circle,
  joined,
  joining,
  onJoin,
  metric,
}: {
  circle: ExploreCircle;
  joined: boolean;
  joining: boolean;
  onJoin: () => void;
  metric: string;
}) {
  const accent = getCircleAccent(circle.slug);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1" style={accent.stripStyle} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={accent.chipStyle}
          >
            <CircleDot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/c/${circle.slug}`}
                  className="truncate font-semibold hover:underline"
                >
                  {circle.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge variant={circle.is_private ? "secondary" : "outline"} className="h-5 text-[10px]">
                    {circle.is_private ? (
                      <Lock className="mr-0.5 h-2.5 w-2.5" />
                    ) : (
                      <Globe className="mr-0.5 h-2.5 w-2.5" />
                    )}
                    {circle.is_private ? "პირადი" : "ღია"}
                  </Badge>
                </div>
              </div>

              {!circle.is_private && (
                joined ? (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    წევრი ✓
                  </Badge>
                ) : (
                  <Button
                    variant="seal"
                    size="sm"
                    onClick={onJoin}
                    disabled={joining}
                    className="shrink-0 rounded-full px-4 text-xs"
                  >
                    {joining ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "შეერთება"
                    )}
                  </Button>
                )
              )}
            </div>

            {circle.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {circle.description}
              </p>
            )}

            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{metric}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
