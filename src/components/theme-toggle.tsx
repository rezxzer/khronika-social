"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return variant === "icon" ? (
      <Button variant="ghost" size="icon-sm" className="shrink-0 rounded-full text-muted-foreground">
        <Sun className="h-[18px] w-[18px]" />
      </Button>
    ) : null;
  }

  const isDark = theme === "dark";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {isDark ? "ნათელი რეჟიმი" : "მუქი რეჟიმი"}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "ნათელი რეჟიმი" : "მუქი რეჟიმი"}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </Button>
  );
}
