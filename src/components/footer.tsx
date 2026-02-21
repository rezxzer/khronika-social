import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>ქრონიკა &copy; {new Date().getFullYear()}</span>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            მთავარი
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-foreground"
          >
            შესვლა
          </Link>
          <Link
            href="/register"
            className="transition-colors hover:text-foreground"
          >
            რეგისტრაცია
          </Link>
        </nav>
      </div>
    </footer>
  );
}
