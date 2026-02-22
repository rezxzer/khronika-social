"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PostType = "story" | "lesson" | "invite";

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: "story", label: "ამბავი" },
  { value: "lesson", label: "სწავლება" },
  { value: "invite", label: "მოწვევა" },
];

export function PostComposer({
  circleId,
  onPosted,
}: {
  circleId: string;
  onPosted: () => void;
}) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>("story");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

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
    if (!user || content.trim().length < 3) return;

    setPosting(true);

    const mediaUrls: string[] = [];
    for (const file of images) {
      const path = `${circleId}/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("posts")
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        toast.error("სურათის ატვირთვა ვერ მოხერხდა");
        setPosting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);
      mediaUrls.push(publicUrl);
    }

    const { error } = await supabase.from("posts").insert({
      circle_id: circleId,
      author_id: user.id,
      type,
      content: content.trim(),
      media_urls: mediaUrls,
    });

    if (error) {
      toast.error("პოსტი ვერ გაიგზავნა");
      setPosting(false);
      return;
    }

    toast.success("პოსტი გამოქვეყნდა!");
    setContent("");
    setType("story");
    setImages([]);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews([]);
    setPosting(false);
    onPosted();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
              type === opt.value
                ? "border-seal bg-seal text-seal-foreground"
                : "border-border text-muted-foreground hover:border-seal/30 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Textarea
        placeholder="რას უზიარებ წრეს?"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="resize-none"
        maxLength={2000}
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
          ფოტო ({images.length}/4)
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
          disabled={posting || content.trim().length < 3}
        >
          {posting && <Loader2 className="animate-spin" />}
          გამოქვეყნება
        </Button>
      </div>
    </form>
  );
}
