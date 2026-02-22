"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss, CircleDot, Bell, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyCircles } from "@/hooks/use-my-circles";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/feed", label: "ფიდი", icon: Rss, match: (p: string) => p === "/feed" },
  {
    href: "/circles",
    label: "წრეები",
    icon: CircleDot,
    match: (p: string) => p.startsWith("/circles") || p.startsWith("/c/"),
  },
  { href: "/notifications", label: "შეტყობინებები", icon: Bell, match: (p: string) => p === "/notifications" },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const { circles, loading } = useMyCircles(6);

  return (
    <aside className="sticky top-[calc(4rem+1.5rem)] hidden h-fit w-[200px] shrink-0 lg:block">
      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-seal-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            ჩემი წრეები
          </h3>
          <Link
            href="/circles/new"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-2 space-y-0.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-1.5">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))
          ) : circles.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground">ჯერ არ გაქვს წრე</p>
              <Button variant="outline" size="xs" asChild className="mt-2">
                <Link href="/circles/new">
                  <PlusCircle className="h-3 w-3" />
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
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                    active
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                    style={accent.chipStyle}
                  >
                    {circle.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{circle.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
