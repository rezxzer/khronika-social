"use client";

import Link from "next/link";
import {
  PenLine,
  Users,
  UserPlus,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RightSidebar() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName =
    profile?.display_name || profile?.username || user?.email?.split("@")[0] || "";
  const initials = (displayName || "?").slice(0, 2).toUpperCase();

  const hasProfile = !!profile?.username;
  const hasBio = !!profile?.bio;

  const tasks = [
    { label: "Create your profile", done: hasProfile },
    { label: "Join 3 circles", done: false },
    { label: "Write your first story", done: false, current: true },
    { label: "Invite friends", done: false },
    { label: "Complete your bio", done: hasBio },
  ];
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <aside className="sticky top-[calc(3.5rem+1.5rem)] hidden h-fit w-[240px] shrink-0 space-y-4 xl:block">
      {/* Welcome / Onboarding widget */}
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
              Welcome, {displayName.split(" ")[0] || "User"} 👋
            </p>
            <p className="text-xs text-muted-foreground">Continue your journey</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-seal transition-all duration-500"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {doneCount}/{tasks.length} tasks
          </span>
        </div>

        {/* Task list */}
        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div key={task.label} className="flex items-center gap-2">
              {task.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <Circle
                  className={`h-4 w-4 shrink-0 ${
                    task.current ? "text-foreground" : "text-muted-foreground/40"
                  }`}
                />
              )}
              <span
                className={`text-xs ${
                  task.done
                    ? "text-muted-foreground line-through"
                    : task.current
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {task.label}
              </span>
              {task.done && <span className="ml-auto text-xs text-green-600">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h3>
        <div className="space-y-1">
          <QuickAction href="/circles/new" icon={PenLine} label="Create Post" accent />
          <QuickAction href="/circles" icon={Users} label="Join Circle" />
          <QuickAction href="/circles/new" icon={UserPlus} label="Invite Friends" />
        </div>
      </div>

      {/* Trending */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trending
          </h3>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            This Week
          </span>
        </div>
        <div className="space-y-2.5">
          <TrendingItem tag="GeorgianCulture" count="1.2K posts" />
          <TrendingItem tag="TravelGeorgia" count="856 posts" />
          <TrendingItem tag="TraditionalFood" count="430 posts" />
          <TrendingItem tag="History" count="710 posts" />
        </div>
        <Link
          href="/circles"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-seal transition-colors hover:text-seal/80"
        >
          View all trends
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

function TrendingItem({ tag, count }: { tag: string; count: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-seal" />
        <span className="text-sm font-medium">#{tag}</span>
      </div>
      <span className="text-xs text-muted-foreground">{count}</span>
    </div>
  );
}
