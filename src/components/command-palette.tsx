"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Rss,
  CircleDot,
  PlusCircle,
  Settings,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const run = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange]
  );

  const go = useCallback(
    (path: string) => run(() => router.push(path)),
    [run, router]
  );

  async function handleLogout() {
    onOpenChange(false);
    await signOut();
    router.push("/");
  }

  const profilePath = profile?.username
    ? `/u/${profile.username}`
    : "/settings/profile";

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="ბრძანებების პალიტრა"
      description="მოძებნე გვერდი ან მოქმედება"
      showCloseButton={false}
    >
      <CommandInput placeholder="მოძებნე გვერდი ან მოქმედება…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-muted-foreground">არაფერი მოიძებნა</p>
          </div>
        </CommandEmpty>

        {user ? (
          <>
            <CommandGroup heading="ნავიგაცია">
              <CommandItem onSelect={() => go("/feed")}>
                <Rss className="mr-2 h-4 w-4" />
                ფიდი
              </CommandItem>
              <CommandItem onSelect={() => go("/circles")}>
                <CircleDot className="mr-2 h-4 w-4" />
                წრეები
              </CommandItem>
              <CommandItem onSelect={() => go("/circles/new")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                ახალი წრის შექმნა
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="ანგარიში">
              <CommandItem onSelect={() => go(profilePath)}>
                <User className="mr-2 h-4 w-4" />
                ჩემი პროფილი
              </CommandItem>
              <CommandItem onSelect={() => go("/settings/profile")}>
                <Settings className="mr-2 h-4 w-4" />
                პარამეტრები
              </CommandItem>
              <CommandItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                გასვლა
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <CommandGroup heading="ანგარიში">
            <CommandItem onSelect={() => go("/login")}>
              <LogIn className="mr-2 h-4 w-4" />
              შესვლა
            </CommandItem>
            <CommandItem onSelect={() => go("/register")}>
              <UserPlus className="mr-2 h-4 w-4" />
              რეგისტრაცია
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>

      <div className="border-t px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <kbd className="pointer-events-none mr-0.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ↑↓
          </kbd>{" "}
          ნავიგაცია{" "}
          <kbd className="pointer-events-none ml-2 mr-0.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ↵
          </kbd>{" "}
          არჩევა{" "}
          <kbd className="pointer-events-none ml-2 mr-0.5 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            Esc
          </kbd>{" "}
          დახურვა
        </p>
      </div>
    </CommandDialog>
  );
}

