import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  MessageCircle,
  ArrowRight,
  Plus,
  Globe,
  CircleDot,
  PenLine,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-seal-light via-seal-muted/20 to-background" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,oklch(0.80_0.10_80/0.25)_0%,transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_60%,oklch(0.75_0.08_75/0.15)_0%,transparent_45%)]" />

        <div className="relative mx-auto max-w-[1100px]">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-4 max-w-2xl font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your{" "}
              <span className="bg-gradient-to-r from-[#B8860B] to-[#D4A420] bg-clip-text text-transparent">
                Stories
              </span>
              , Your{" "}
              <span className="bg-gradient-to-r from-[#B8860B] to-[#D4A420] bg-clip-text text-transparent">
                Circles
              </span>
            </h1>

            <p className="mb-8 max-w-md text-base text-muted-foreground sm:text-lg">
              Build meaningful communities, share knowledge, and grow together.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="seal"
                size="lg"
                asChild
                className="rounded-full px-7 text-base"
              >
                <Link href="/register">
                  <Plus className="h-4 w-4" />
                  Create Circle
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="rounded-full px-7 text-base"
              >
                <Link href="/circles">
                  <Globe className="h-4 w-4" />
                  Explore Circles
                </Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CircleDot className="h-3.5 w-3.5 text-seal" />
                8 432 Circles
              </span>
              <span className="hidden h-3.5 w-px bg-border sm:inline" />
              <span className="flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5 text-seal" />
                24K Stories
              </span>
              <span className="hidden h-3.5 w-px bg-border sm:inline" />
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-seal" />
                Georgia · Worldwide
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            რატომ ქრონიკა?
          </h2>
          <p className="text-muted-foreground">
            სამი პრინციპი, რომელიც განგვასხვავებს
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="წრეები"
            description="შექმენი ან შეუერთდი წრეებს — უბანი, კლასი, კლუბი, სკვადი, ოჯახი. შენ ირჩევ ვინ არის შენს სივრცეში."
            accent
          />
          <FeatureCard
            icon={<BookOpen className="h-5 w-5" />}
            title="ამბები და სწავლებები"
            description="ყოველ პოსტს აქვს მიზანი — გაუზიარე გამოცდილება, ცოდნა ან რჩევა. არა ქაოსური ფიდი, არამედ ხარისხი."
          />
          <FeatureCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="მოწვევები"
            description="დაგეგმე შეხვედრები და ღონისძიებები წრეში. ჩათვალე, რომ ეს შენი პატარა სამყაროა."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t bg-gradient-to-b from-seal-light/50 to-background">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-5 px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            მზად ხარ?
          </h2>
          <p className="max-w-md text-muted-foreground">
            შექმენი ანგარიში, გააკეთე პირველი წრე და მოიწვიე შენი ადამიანები.
          </p>
          <Button
            variant="seal"
            size="lg"
            asChild
            className="rounded-full px-10 text-base"
          >
            <Link href="/register">
              უფასოდ დაიწყე
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 ${
          accent
            ? "bg-seal-muted text-seal group-hover:bg-seal group-hover:text-seal-foreground"
            : "bg-muted text-foreground group-hover:bg-foreground group-hover:text-background"
        }`}
      >
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
