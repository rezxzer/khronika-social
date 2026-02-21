"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  LogOut,
  Loader2,
  CircleDot,
  Rss,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useProfile();

  const initials =
    (profile?.display_name || profile?.username || user?.email || "?")
      .slice(0, 2)
      .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4 sm:px-6">
        <Link
          href={user ? "/feed" : "/"}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">ქრონიკა</span>
        </Link>

        <nav className="flex items-center gap-1">
          {authLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <NavLink href="/feed" active={pathname === "/feed"}>
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">ფიდი</span>
              </NavLink>
              <NavLink
                href="/circles"
                active={
                  pathname.startsWith("/circles") ||
                  pathname.startsWith("/c/")
                }
              >
                <CircleDot className="h-4 w-4" />
                <span className="hidden sm:inline">წრეები</span>
              </NavLink>

              <div className="mx-1.5 h-5 w-px bg-border" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={profile?.avatar_url ?? undefined}
                      />
                      <AvatarFallback className="text-[10px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-medium">
                      {profile?.display_name || profile?.username || "მომხმარებელი"}
                    </p>
                    {profile?.username && (
                      <p className="truncate text-xs text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {profile?.username && (
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${profile.username}`}>
                        <User className="mr-2 h-4 w-4" />
                        ჩემი პროფილი
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      პარამეტრები
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    გასვლა
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
