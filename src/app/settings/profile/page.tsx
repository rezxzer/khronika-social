"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AppShell } from "@/components/layout/app-shell";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
  User,
  TriangleAlert,
  Trash2,
  Mail,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { useWebPush } from "@/hooks/use-web-push";

function sanitizeFilename(name: string): string {
  const ext = name.lastIndexOf(".") >= 0 ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, name.length - ext.length);
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  return (safe || "avatar") + ext.toLowerCase();
}

export default function ProfileSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bucketWarning, setBucketWarning] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const {
    state: pushState,
    loading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    lastError: pushLastError,
  } = useWebPush(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? "");
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error: listErr } = await supabase.storage.from("avatars").list(user.id, { limit: 1 });
        if (listErr) {
          const msg = listErr.message.toLowerCase();
          if (msg.includes("not found") || msg.includes("bucket")) {
            setBucketWarning(
              "avatars bucket არ არსებობს. Supabase Dashboard → Storage → Buckets → შექმენი 'avatars' (Public ON) და გაუშვი database/0004_storage_avatars.sql",
            );
          } else if (msg.includes("not authorized") || msg.includes("policy")) {
            setBucketWarning(
              "avatars bucket private-ია ან policy არ გაშვებულა. Dashboard → Storage → avatars → გადართე Public ON და გაუშვი database/0004_storage_avatars.sql",
            );
          }
        }
        void data;
      } catch {
        // ignore network errors
      }
    })();
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setError("მხოლოდ სურათის ფაილები დაშვებულია");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("ფაილის ზომა მაქსიმუმ 2MB");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    const safeName = sanitizeFilename(file.name);
    const path = `${user.id}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(`ატვირთვის შეცდომა: ${uploadError.message}`);
      setUploading(false);
      setAvatarPreview(null);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    setAvatarUrl(publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(false);
    setSaving(true);

    const avatarWithCacheBust = avatarUrl
      ? avatarUrl.split("?")[0] + `?v=${Date.now()}`
      : null;

    const updates: Record<string, unknown> = {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarWithCacheBust,
    };

    if (username.trim()) {
      updates.username = username.trim().toLowerCase();
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      if (updateError.code === "23505") {
        setError("ეს username უკვე დაკავებულია");
      } else {
        setError(updateError.message);
      }
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    refetch();
    toast.success("პროფილი წარმატებით განახლდა");
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirm !== "წაშლა") return;
    setDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("სესია ვერ მოიძებნა, გადაიტვირთე გვერდი");
        setDeleting(false);
        return;
      }

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || "ანგარიშის წაშლა ვერ მოხერხდა");
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      toast.success("ანგარიში წაიშალა");
      router.replace("/");
    } catch {
      toast.error("ანგარიშის წაშლა ვერ მოხერხდა");
      setDeleting(false);
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  const initials =
    (displayName || username || user.email || "?")
      .slice(0, 2)
      .toUpperCase();

  return (
    <AppShell>
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">პროფილის რედაქტირება</h1>
        <p className="text-muted-foreground">განაახლე შენი ინფორმაცია</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>პროფილი</CardTitle>
            <CardDescription>
              ეს ინფორმაცია ხილული იქნება სხვა მომხმარებლებისთვის
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {bucketWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-50/50 px-3 py-2.5 text-sm text-amber-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{bucketWarning}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>პროფილი წარმატებით განახლდა</span>
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview ?? avatarUrl ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                  ფოტოს შეცვლა
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG — მაქსიმუმ 2MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">@</span>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                მხოლოდ ლათინური ასოები, ციფრები და _
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">სახელი</Label>
              <Input
                id="display_name"
                placeholder="თქვენი სახელი"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">ბიო</Label>
              <Textarea
                id="bio"
                placeholder="მოკლედ შენს შესახებ..."
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
              />
              <p className="text-right text-xs text-muted-foreground">
                {bio.length}/300
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving || uploading} className="w-full">
              {saving && <Loader2 className="animate-spin" />}
              შენახვა
            </Button>
          </CardFooter>
        </form>
      </Card>
      {/* Email Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            ელფოსტა
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user.email || "ელფოსტა მიუწვდომელია"}
          </p>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      {pushState !== "unsupported" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Push შეტყობინებები
            </CardTitle>
            <CardDescription>
              მიიღე შეტყობინება ახალი პირადი მესიჯის შესახებ ბრაუზერის გარეთაც
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pushState === "denied" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BellOff className="h-4 w-4 shrink-0" />
                <span>
                  შეტყობინებები დაბლოკილია ბრაუზერში. გთხოვთ ნებართვა ბრაუზერის
                  პარამეტრებში ჩართოთ.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {pushState === "subscribed"
                    ? "შეტყობინებები ჩართულია"
                    : "შეტყობინებები გამორთულია"}
                </div>
                <Switch
                  checked={pushState === "subscribed"}
                  disabled={pushLoading}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      const result = await pushSubscribe();
                      if (result.ok) toast.success("Push შეტყობინებები ჩართულია");
                      else toast.error(result.message || pushLastError || "ვერ ჩაირთო push შეტყობინებები");
                    } else {
                      const result = await pushUnsubscribe();
                      if (result.ok) toast.success("Push შეტყობინებები გამოირთო");
                      else toast.error(result.message || pushLastError || "ვერ გამოირთო push შეტყობინებები");
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            საშიში ზონა
          </CardTitle>
          <CardDescription>
            ანგარიშის წაშლა შეუქცევადია
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ანგარიშის წაშლით სამუდამოდ წაიშლება შენი პროფილი, პოსტები,
            კომენტარები, რეაქციები და წრეების წევრობა.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            ანგარიშის წაშლა
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive">
              ანგარიშის წაშლა
            </DialogTitle>
            <DialogDescription>
              ეს მოქმედება შეუქცევადია. წაიშლება შენი პროფილი, ყველა
              პოსტი, კომენტარი და წრეების წევრობა.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              დასადასტურებლად ჩაწერე:{" "}
              <span className="font-bold text-destructive">წაშლა</span>
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="წაშლა"
              autoComplete="off"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                გაუქმება
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "წაშლა" || deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "სამუდამოდ წაშლა"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AppShell>
  );
}
