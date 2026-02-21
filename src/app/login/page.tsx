"use client";

import { useState } from "react";
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
import { Loader2, AlertCircle, BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
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
            <CardTitle className="text-xl">ანგარიშზე შესვლა</CardTitle>
            <CardDescription>
              შეიყვანე ელფოსტა და პაროლი
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              შესვლა
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              არ გაქვს ანგარიში?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
              >
                რეგისტრაცია
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
