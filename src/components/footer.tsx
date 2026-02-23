import Link from "next/link";
import { BookOpen, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/50">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Left: branding */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-seal text-seal-foreground">
              <BookOpen className="h-3 w-3" />
            </div>
            <span>
              Khronika &copy; {new Date().getFullYear()} &middot; Made with{" "}
              <Heart className="inline h-3 w-3 text-red-500" fill="currentColor" />{" "}
              in Georgia
            </span>
          </div>

          {/* Center: nav links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/rules" className="transition-colors hover:text-foreground">
              წესები
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              კონფიდენციალურობა
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              კონტაქტი
            </Link>
          </nav>

          {/* Right: social icons */}
          <div className="flex items-center gap-3">
            <SocialIcon href="https://instagram.com" label="Instagram">
              <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Z" />
              <circle cx="12" cy="12" r="3.5" />
              <circle cx="17.5" cy="6.5" r="1" />
            </SocialIcon>
            <SocialIcon href="https://facebook.com" label="Facebook">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </SocialIcon>
            <SocialIcon href="https://x.com" label="X">
              <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768" />
            </SocialIcon>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </a>
  );
}
