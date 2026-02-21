"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Loader2, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-5 w-5" />
          <span>ქრონიკა</span>
        </Link>

        <nav className="ml-auto flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(pathname === "/feed" && "bg-accent")}
              >
                <Link href="/feed">ფიდი</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(pathname.startsWith("/circles") && "bg-accent")}
              >
                <Link href="/circles">
                  <CircleDot className="h-4 w-4" />
                  <span className="hidden sm:inline">წრეები</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
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
                className={cn(pathname === "/login" && "bg-accent")}
              >
                <Link href="/login">შესვლა</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">რეგისტრაცია</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
