"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Loader2, CircleDot, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">ქრონიკა</span>
        </Link>

        <nav className="flex items-center gap-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <NavLink href="/feed" active={pathname === "/feed"}>
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">ფიდი</span>
              </NavLink>
              <NavLink
                href="/circles"
                active={pathname.startsWith("/circles") || pathname.startsWith("/c/")}
              >
                <CircleDot className="h-4 w-4" />
                <span className="hidden sm:inline">წრეები</span>
              </NavLink>
              <div className="mx-1 h-5 w-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">გასვლა</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  pathname === "/login" && "text-foreground bg-accent"
                )}
              >
                <Link href="/login">შესვლა</Link>
              </Button>
              <Button size="sm" asChild className="ml-1 rounded-full px-5">
                <Link href="/register">რეგისტრაცია</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn(
        "gap-1.5 text-muted-foreground hover:text-foreground",
        active && "bg-accent text-foreground font-medium"
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
