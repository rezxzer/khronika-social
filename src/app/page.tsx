import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center pt-20 pb-12 text-center">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <BookOpen className="h-8 w-8" />
      </div>

      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
        ქრონიკა
      </h1>
      <p className="mb-8 max-w-md text-lg text-muted-foreground">
        წრეებზე დაფუძნებული სოციალური ქსელი, სადაც კონტენტი არის ამბავი,
        სწავლება და მოწვევა.
      </p>

      <div className="flex gap-3">
        <Button size="lg" asChild>
          <Link href="/register">დაიწყე ახლა</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">შესვლა</Link>
        </Button>
      </div>

      <div className="mt-20 grid w-full max-w-2xl gap-8 sm:grid-cols-3">
        <FeatureCard
          icon={<Users className="h-6 w-6" />}
          title="წრეები"
          description="შექმენი ან შეუერთდი წრეებს — უბანი, კლასი, კლუბი, ოჯახი."
        />
        <FeatureCard
          icon={<BookOpen className="h-6 w-6" />}
          title="ამბები და სწავლებები"
          description="გაუზიარე გამოცდილება, ცოდნა და რჩევები შენს წრეს."
        />
        <FeatureCard
          icon={<MessageCircle className="h-6 w-6" />}
          title="მოწვევები"
          description="დაგეგმე შეხვედრები და ღონისძიებები წრეში."
        />
      </div>
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
    <div className="flex flex-col items-center gap-3 rounded-lg border p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
