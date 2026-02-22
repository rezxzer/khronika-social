"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { normalizeEmail, translateAuthError, isRateLimitError } from "@/lib/auth/normalize";
import { Loader2, AlertCircle, MailCheck, BookOpen, Timer } from "lucide-react";

const COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const isDisabled = loading || cooldown > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("პაროლები არ ემთხვევა");
      return;
    }

    if (password.length < 6) {
      setError("პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს");
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("ელფოსტა არასწორადაა შეყვანილი (შეამოწმე ზედმეტი space).");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (error) {
      const isRL = isRateLimitError(error.message);
      if (isRL) {
        console.warn("Rate limit hit — cooldown started");
        setCooldown(COOLDOWN_SECONDS);
      } else {
        console.error("Register error:", error.message);
      }
      setError(translateAuthError(error.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/feed");
      return;
    }

    setEmailSent(true);
    setLoading(false);
  }

  if (emailSent) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4">
        <Card className="w-full max-w-[400px] text-center shadow-sm">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">შეამოწმე ელფოსტა</CardTitle>
            <CardDescription className="mt-1">
              დადასტურების ბმული გაიგზავნა მისამართზე{" "}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-4">
            <Button variant="outline" asChild>
              <Link href="/login">შესვლის გვერდზე დაბრუნება</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
          <BookOpen className="h-4 w-4" />
        </div>
        <span className="text-lg font-bold text-foreground">ქრონიკა</span>
      </Link>

      <Card className="w-full max-w-[400px] shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl">ანგარიშის შექმნა</CardTitle>
            <CardDescription>შექმენი ანგარიში ქრონიკაზე</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">სახელი</Label>
              <Input
                id="name"
                type="text"
                placeholder="თქვენი სახელი"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ელფოსტა</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">პაროლი</Label>
              <Input
                id="password"
                type="password"
                placeholder="მინიმუმ 6 სიმბოლო"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">გაიმეორე პაროლი</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button variant="seal" className="w-full" type="submit" disabled={isDisabled}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : cooldown > 0 ? (
                <>
                  <Timer className="h-4 w-4" />
                  დაელოდე {cooldown}წმ
                </>
              ) : null}
              {!loading && cooldown <= 0 && "რეგისტრაცია"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              უკვე გაქვს ანგარიში?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                შესვლა
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
