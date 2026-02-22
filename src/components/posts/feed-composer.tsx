"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PostType = "story" | "lesson" | "invite";

const TYPE_OPTIONS: { value: PostType; label: string; icon: string }[] = [
  { value: "story", label: "Story", icon: "ðŸ“–" },
  { value: "lesson", label: "Lesson", icon: "ðŸŽ“" },
  { value: "invite", label: "Invite", icon: "ðŸ“¨" },
];

interface CircleOption {
  id: string;
  name: string;
  slug: string;
}

export function FeedComposer({
  circleIds,
  avatarUrl,
  onPosted,
}: {
  circleIds: string[];
  avatarUrl: string | null;
  onPosted: () => void;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [circles, setCircles] = useState<CircleOption[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<string>("");

  const [type, setType] = useState<PostType>("story");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (circleIds.length === 0) return;
    supabase
      .from("circles")
      .select("id, name, slug")
      .in("id", circleIds)
      .order("name")
      .then(({ data }) => {
        if (data) {
          setCircles(data);
          setSelectedCircle(data[0]?.id ?? "");
        }
      });
  }, [circleIds]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const allowed = files.filter((f) => f.type.startsWith("image/")).slice(0, 4 - images.length);
    if (allowed.length === 0) return;
    setImages((prev) => [...prev, ...allowed]);
    setPreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || content.trim().length < 3 || !selectedCircle) return;

    setPosting(true);

    const mediaUrls: string[] = [];
    for (const file of images) {
      const path = `${selectedCircle}/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("posts")
        .upload(path, file, { upsert: true });
      if (uploadErr) {
        toast.error("áƒ¡áƒ£áƒ áƒáƒ—áƒ˜áƒ¡ áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ");
        setPosting(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);
      mediaUrls.push(publicUrl);
    }

    const { error } = await supabase.from("posts").insert({
      circle_id: selectedCircle,
      author_id: user.id,
      type,
      content: content.trim(),
      media_urls: mediaUrls,
    });

    if (error) {
      toast.error("áƒžáƒáƒ¡áƒ¢áƒ˜ áƒ•áƒ”áƒ  áƒ’áƒáƒ˜áƒ’áƒ–áƒáƒ•áƒœáƒ");
      setPosting(false);
      return;
    }

    toast.success("áƒžáƒáƒ¡áƒ¢áƒ˜ áƒ’áƒáƒ›áƒáƒ¥áƒ•áƒ”áƒ§áƒœáƒ“áƒ!");
    setContent("");
    setType("story");
    setImages([]);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews([]);
    setPosting(false);
    setExpanded(false);
    onPosted();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-seal/10">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback className="bg-seal-muted text-seal text-xs">
            {user?.email?.slice(0, 2).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full rounded-full border bg-muted/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              What&apos;s on your mind?
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
                      type === opt.value
                        ? "border-seal bg-seal text-seal-foreground"
                        : "border-border text-muted-foreground hover:border-seal/30 hover:text-foreground"
                    )}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}

                {circles.length > 1 && (
                  <select
                    value={selectedCircle}
                    onChange={(e) => setSelectedCircle(e.target.value)}
                    className="ml-auto rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-seal/30"
                  >
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <textarea
                placeholder="áƒ áƒáƒ¡ áƒ£áƒ–áƒ˜áƒáƒ áƒ”áƒ‘ áƒ¬áƒ áƒ”áƒ¡?"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-none rounded-lg border-0 bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
                maxLength={2000}
                autoFocus
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt=""
                        className="aspect-video w-full rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 4 || posting}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <ImagePlus className="h-4 w-4" />
                  áƒ¤áƒáƒ¢áƒ
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <Button
                  type="submit"
                  variant="seal"
                  size="sm"
                  className="rounded-full px-6"
                  disabled={posting || content.trim().length < 3 || !selectedCircle}
                >
                  {posting && <Loader2 className="animate-spin" />}
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
