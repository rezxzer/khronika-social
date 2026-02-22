"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useUnreadCount } from "@/hooks/use-notifications";

const NAV_ITEMS = [
  {
    href: "/feed",
    label: "ფიდი",
    icon: Home,
    match: (p: string) => p === "/feed",
  },
  {
    href: "/circles/explore",
    label: "აღმოჩენა",
    icon: Compass,
    match: (p: string) => p.startsWith("/circles") || p.startsWith("/c/"),
  },
  {
    href: "/circles/new",
    label: "შექმნა",
    icon: PlusCircle,
    match: (p: string) => p === "/circles/new",
    accent: true,
  },
  {
    href: "/notifications",
    label: "შეტყობინება",
    icon: Bell,
    match: (p: string) => p === "/notifications",
    badgeKey: "notifications" as const,
  },
  {
    href: "/settings/profile",
    label: "პროფილი",
    icon: User,
    match: (p: string) => p.startsWith("/settings") || p.startsWith("/u/"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { count: unreadCount } = useUnreadCount();

  if (loading || !user) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-lg sm:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const profileHref =
            item.label === "პროფილი" && profile?.username
              ? `/u/${profile.username}`
              : item.href;

          return (
            <Link
              key={item.label}
              href={profileHref}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors",
                item.accent
                  ? "text-seal"
                  : active
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    item.accent && "h-6 w-6",
                  )}
                />
                {item.badgeKey === "notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-seal px-0.5 text-[8px] font-bold text-seal-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
              {active && !item.accent && (
                <span className="absolute -top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-seal" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
