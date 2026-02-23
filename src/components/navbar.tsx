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
  Ban,
  Menu,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/admin";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useUnreadMessages } from "@/hooks/use-conversations";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/theme-toggle";

const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

const MobileDrawer = dynamic(
  () => import("@/components/mobile-drawer").then((m) => m.MobileDrawer),
  { ssr: false },
);

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useProfile();
  const { count: unreadCount } = useUnreadCount();
  const { count: unreadMessages } = useUnreadMessages(user?.id);

  const displayName =
    profile?.display_name || profile?.username || user?.email?.split("@")[0] || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const [cmdOpen, setCmdOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/feed", label: "ფიდი" },
    { href: "/circles", label: "წრეები" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-2 px-3 sm:gap-6 sm:px-6">
          {/* Hamburger — visible on < lg */}
          {user && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="მენიუ"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

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

          {/* Nav links — hidden on mobile, shown sm+ */}
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
                        : "text-muted-foreground hover:text-foreground",
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

          {/* Search bar — center, hidden on < md */}
          <div className="hidden flex-1 justify-center md:flex">
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="flex w-full max-w-[340px] items-center gap-2 rounded-full border bg-muted/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Search className="h-4 w-4" />
              <span>ძებნა ამბებში, წრეებში...</span>
            </button>
          </div>

          {/* Spacer on mobile when search hidden */}
          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-1">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                {/* Search icon on mobile */}
                <button
                  type="button"
                  onClick={() => router.push("/search")}
                  className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                  aria-label="ძებნა"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>

                {/* Bell */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href="/notifications">
                    <Bell className="h-[18px] w-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-seal px-1 text-[10px] font-bold text-seal-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* Dark mode toggle */}
                <ThemeToggle />

                {/* Messages — visible on md+ */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative hidden shrink-0 rounded-full text-muted-foreground hover:text-foreground md:inline-flex"
                  asChild
                >
                  <Link href="/messages">
                    <MessageSquare className="h-[18px] w-[18px]" />
                    {unreadMessages > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-seal px-1 text-[10px] font-bold text-seal-foreground">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* Create button — visible on sm+ (bottom nav handles mobile) */}
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
                      className="ml-0.5 flex items-center gap-2 rounded-full px-1 py-0.5 transition-colors hover:bg-accent sm:ml-1"
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
                    <DropdownMenuItem asChild>
                      <Link
                        href={
                          profile?.username
                            ? `/u/${profile.username}`
                            : "/settings/profile"
                        }
                      >
                        <User className="mr-2 h-4 w-4" />
                        ჩემი პროფილი
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/profile">
                        <Settings className="mr-2 h-4 w-4" />
                        პარამეტრები
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/blocked">
                        <Ban className="mr-2 h-4 w-4" />
                        დაბლოკილები
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <ThemeToggle variant="full" />
                    </DropdownMenuItem>
                    {isAdmin(user.id) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin/reports">
                            <Shield className="mr-2 h-4 w-4" />
                            ადმინ პანელი
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
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
                    pathname === "/login" && "bg-accent text-foreground",
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
      {user && <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />}
    </>
  );
}
