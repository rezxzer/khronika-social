"use client";

import Link from "next/link";
import {
  PenLine,
  Users,
  Compass,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useTrendingCircles } from "@/hooks/use-trending-circles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCircleAccent } from "@/lib/ui/circle-style";

export function RightSidebar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { steps, doneCount, total, allDone, loading: onboardingLoading } = useOnboarding();
  const { circles: trending, loading: trendingLoading } = useTrendingCircles(5);

  const displayName =
    profile?.display_name || profile?.username || user?.email?.split("@")[0] || "";
  const initials = (displayName || "?").slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-[calc(3.5rem+1.5rem)] hidden h-fit w-[240px] shrink-0 space-y-4 xl:block">
      {/* Onboarding widget — hide when all done */}
      {!allDone && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-seal/20">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-seal-muted text-seal text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                გამარჯობა, {displayName.split(" ")[0] || "User"}
              </p>
              <p className="text-xs text-muted-foreground">დაასრულე დაწყება</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-seal transition-all duration-500"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {doneCount}/{total}
            </span>
          </div>

          {onboardingLoading ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              {steps.map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-accent/50"
                >
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={`text-xs ${
                      step.done
                        ? "text-muted-foreground line-through"
                        : "font-medium text-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.done && <span className="ml-auto text-xs text-green-600">✓</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          სწრაფი მოქმედებები
        </h3>
        <div className="space-y-1">
          <QuickAction href="/feed" icon={PenLine} label="პოსტის დაწერა" accent />
          <QuickAction href="/circles/explore" icon={Compass} label="წრეების აღმოჩენა" />
          <QuickAction href="/circles" icon={Users} label="ჩემი წრეები" />
        </div>
      </div>

      {/* Trending */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ტრენდული
          </h3>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            ეს კვირა
          </span>
        </div>

        {trendingLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : trending.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-xs text-muted-foreground">ჯერ აქტივობა არ არის</p>
            <Link
              href="/circles/explore"
              className="mt-1 inline-block text-xs font-medium text-seal hover:text-seal/80"
            >
              შეუერთდი წრეებს
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {trending.map((circle) => {
              const accent = getCircleAccent(circle.slug);
              return (
                <Link
                  key={circle.id}
                  href={`/c/${circle.slug}`}
                  className="flex items-center justify-between rounded-lg px-1 py-0.5 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: accent.hex }}
                    />
                    <span className="text-sm font-medium">{circle.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {circle.post_count} {circle.post_count === 1 ? "პოსტი" : "პოსტი"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <Link
          href="/circles/explore"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-seal transition-colors hover:text-seal/80"
        >
          ყველას ნახვა
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
        accent
          ? "text-seal hover:bg-seal-muted"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
