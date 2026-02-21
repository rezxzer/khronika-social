"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-5 w-5" />
          <span>ქრონიკა</span>
        </Link>

        <nav className="ml-auto flex items-center gap-2">
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
        </nav>
      </div>
    </header>
  );
}
