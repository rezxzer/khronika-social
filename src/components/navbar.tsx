"use client";

import { useState } from "react";
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
  Settings,
  User,
  Search,
  Plus,
  Bell,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { CommandPalette } from "@/components/command-palette";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useProfile();

  const displayName =
    profile?.display_name || profile?.username || user?.email?.split("@")[0] || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const [cmdOpen, setCmdOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/feed", label: "ფიდი" },
    { href: "/circles", label: "წრეები" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-6 px-4 sm:px-6">
          {/* Logo */}
          <Link
            href={user ? "/feed" : "/"}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-seal text-seal-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="hidden text-lg font-bold tracking-tight sm:inline">
              Khronika
            </span>
          </Link>

          {/* Nav links — underline style like mockup */}
          {user && (
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/feed"
                    ? pathname === "/feed"
                    : pathname.startsWith("/circles") || pathname.startsWith("/c/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3 py-1 text-sm transition-colors duration-150",
                      active
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-seal" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Search bar — center */}
          <div className="hidden flex-1 justify-center md:flex">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex w-full max-w-[340px] items-center gap-2 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Search className="h-4 w-4" />
              <span>ძებნა ამბებში, წრეებში...</span>
            </button>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1.5">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                {/* Bell */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Bell className="h-[18px] w-[18px]" />
                </Button>

                {/* Messages */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-[18px] w-[18px]" />
                </Button>

                {/* Create button */}
                <Button
                  variant="seal"
                  size="sm"
                  asChild
                  className="ml-1 hidden rounded-full px-4 sm:inline-flex"
                >
                  <Link href="/circles/new">
                    <Plus className="h-4 w-4" />
                    შექმნა
                  </Link>
                </Button>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="ml-1 flex items-center gap-2 rounded-full px-1 py-0.5 transition-colors hover:bg-accent"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-seal/20">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-seal-muted text-seal text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden text-sm font-medium lg:inline">
                        {displayName.length > 10
                          ? displayName.slice(0, 10) + "."
                          : displayName}
                      </span>
                      <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground lg:inline" />
                    </button>
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
                    pathname === "/login" && "bg-accent text-foreground"
                  )}
                >
                  <Link href="/login">შესვლა</Link>
                </Button>
                <Button
                  variant="seal"
                  size="sm"
                  asChild
                  className="ml-1 rounded-full px-5"
                >
                  <Link href="/register">რეგისტრაცია</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
