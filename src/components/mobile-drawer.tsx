"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, CircleDot, Bell, MessageSquare, Plus, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyCircles } from "@/hooks/use-my-circles";
import { useUnreadCount } from "@/hooks/use-notifications";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/feed", label: "Home", icon: Home, match: (p: string) => p === "/feed" },
  { href: "/feed", label: "Feed", icon: Rss, match: () => false },
  {
    href: "/circles",
    label: "Circles",
    icon: CircleDot,
    match: (p: string) => (p.startsWith("/circles") && !p.startsWith("/circles/explore")) || p.startsWith("/c/"),
  },
  {
    href: "/circles/explore",
    label: "Explore",
    icon: Compass,
    match: (p: string) => p === "/circles/explore",
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    match: (p: string) => p === "/notifications",
    badgeKey: "notifications" as const,
  },
  { href: "/messages", label: "Messages", icon: MessageSquare, match: (p: string) => p === "/messages" },
];

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const pathname = usePathname();
  const { circles, loading } = useMyCircles(8);
  const { count: unreadNotifs } = useUnreadCount();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] overflow-y-auto p-0 sm:max-w-[280px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-left font-serif text-lg">ქრონიკა</SheetTitle>
        </SheetHeader>

        <nav className="space-y-0.5 px-3 pt-3">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                  active
                    ? "bg-seal-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {item.badgeKey === "notifications" && unreadNotifs > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-seal px-1.5 text-[10px] font-bold text-seal-foreground">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t px-3 pt-4">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              MY CIRCLES
            </h3>
            <Link
              href="/circles/new"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-seal-muted hover:text-seal"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-2 space-y-0.5 pb-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-1.5">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))
            ) : circles.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">ჯერ არ გაქვს წრე</p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="mt-2 border-seal/30 text-seal hover:bg-seal-muted"
                  onClick={() => onOpenChange(false)}
                >
                  <Link href="/circles/new">
                    <Plus className="h-3 w-3" />
                    შექმენი წრე
                  </Link>
                </Button>
              </div>
            ) : (
              circles.map((circle) => {
                const accent = getCircleAccent(circle.slug);
                const active = pathname === `/c/${circle.slug}`;
                return (
                  <Link
                    key={circle.id}
                    href={`/c/${circle.slug}`}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                      active
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: accent.hex }}
                    />
                    <span className="truncate">{circle.name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
