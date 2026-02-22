"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AppShell } from "@/components/layout/app-shell";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u10D0-\u10FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function NewCirclePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("სახელი აუცილებელია");
      return;
    }

    const finalSlug = slug.trim() || slugify(name);
    if (!finalSlug) {
      setError("Slug აუცილებელია");
      return;
    }

    setLoading(true);

    const { data, error: insertError } = await supabase
      .from("circles")
      .insert({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        is_private: isPrivate,
        owner_id: user!.id,
      })
      .select("slug")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        setError("ეს slug უკვე დაკავებულია, სცადე სხვა");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    toast.success("წრე წარმატებით შეიქმნა!");
    router.push(`/c/${data.slug}`);
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
    <div className="mx-auto max-w-lg">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/circles">
          <ArrowLeft className="h-4 w-4" />
          წრეებზე დაბრუნება
        </Link>
      </Button>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">ახალი წრე</CardTitle>
            <CardDescription>
              შექმენი წრე და მოიწვიე შენი ხალხი
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
              <Label htmlFor="name">სახელი</Label>
              <Input
                id="name"
                placeholder="მაგ. ჩემი უბანი"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL-ში გამოჩნდება)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/c/</span>
                <Input
                  id="slug"
                  placeholder="chemi-ubani"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">აღწერა</Label>
              <Textarea
                id="description"
                placeholder="რაზეა ეს წრე..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">პირადი წრე</p>
                <p className="text-xs text-muted-foreground">
                  მხოლოდ მოწვეულ წევრებს შეუძლიათ ნახვა
                </p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              შექმნა
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
    </AppShell>
  );
}
