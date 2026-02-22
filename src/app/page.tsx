import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02)_0%,transparent_60%)]" />

        <div className="relative mx-auto max-w-[1100px]">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              წრეებზე დაფუძნებული სოციალური ქსელი
            </div>

            <h1 className="mb-5 max-w-2xl font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              შენი ამბები, <br className="hidden sm:block" />
              <span className="text-muted-foreground">შენს წრეში</span>
            </h1>

            <p className="mb-10 max-w-lg text-base text-muted-foreground sm:text-lg">
              ქრონიკა არის სივრცე, სადაც ყველაფერი იწყება წრეებიდან — გაუზიარე
              გამოცდილება, ცოდნა და მოწვევა იმ ადამიანებს, ვინც ნამდვილად
              გაინტერესებს.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="rounded-full px-8">
                <Link href="/register">
                  უფასოდ დაიწყე
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full px-8"
              >
                <Link href="/login">უკვე მაქვს ანგარიში</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6">
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
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors duration-200 group-hover:bg-foreground group-hover:text-background">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
