"use client";

import Link from "next/link";
import { PlusCircle, User, Settings, Bell } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

export function RightSidebar() {
  const { profile } = useProfile();

  const profileHref = profile?.username
    ? `/u/${profile.username}`
    : "/settings/profile";

  return (
    <aside className="sticky top-[calc(4rem+1.5rem)] hidden h-fit w-[240px] shrink-0 space-y-4 xl:block">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          სწრაფი მოქმედებები
        </h3>
        <div className="space-y-1">
          <QuickAction href="/circles/new" icon={PlusCircle} label="ახალი წრე" />
          <QuickAction href={profileHref} icon={User} label="ჩემი პროფილი" />
          <QuickAction href="/settings/profile" icon={Settings} label="პარამეტრები" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          შეტყობინებები
        </h3>
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            ჯერ ცარიელია
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">
            შემდეგ ეტაპზე
          </p>
        </div>
      </div>
    </aside>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent/50 hover:text-foreground"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
