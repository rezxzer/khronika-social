"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, UserX } from "lucide-react";
import type { Profile } from "@/hooks/use-profile";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    fetch();
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UserX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">მომხმარებელი ვერ მოიძებნა</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          @{username} არ არსებობს ან წაშლილია
        </p>
      </div>
    );
  }

  const initials =
    (profile.display_name || profile.username || "?")
      .slice(0, 2)
      .toUpperCase();

  const joinDate = new Date(profile.created_at).toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Profile header */}
      <div className="rounded-xl border p-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">
              {profile.display_name || profile.username}
            </h1>
            {profile.username && (
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <span>შემოუერთდა {joinDate}</span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Posts placeholder */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">პოსტები</h2>
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <p className="font-medium">მალე დაემატება</p>
          <p className="mt-1 text-sm">
            მომხმარებლის პოსტები აქ გამოჩნდება
          </p>
        </div>
      </div>
    </div>
  );
}
