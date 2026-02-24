"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VIDEO_ACCEPT_ATTR, validateVideoFile } from "@/lib/video-validation";

type PostType = "story" | "lesson" | "invite";
type ComposerMediaMode = "images" | "video";

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: "story", label: "ამბავი" },
  { value: "lesson", label: "სწავლება" },
  { value: "invite", label: "მოწვევა" },
];

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function PostComposer({
  circleId,
  onPosted,
}: {
  circleId: string;
  onPosted: () => void;
}) {
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>("story");
  const [content, setContent] = useState("");
  const [mediaMode, setMediaMode] = useState<ComposerMediaMode>("images");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [inlineError, setInlineError] = useState<string | null>(null);

  function clearImages() {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setImages([]);
    setPreviews([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function clearVideo() {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setInlineError(null);
    const files = Array.from(e.target.files ?? []);
    const allowed = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4 - images.length);

    if (allowed.length === 0) {
      setInlineError("აირჩიე სურათის ფაილი");
      return;
    }

    if (mediaMode === "video") {
      clearVideo();
      setMediaMode("images");
    }

    setImages((prev) => [...prev, ...allowed]);
    setPreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setInlineError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateVideoFile(file);
    if (validationError) {
      setInlineError(validationError);
      toast.error(validationError);
      return;
    }

    if (images.length > 0) clearImages();
    clearVideo();
    setMediaMode("video");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadVideoWithProgress(path: string, file: File) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!token || !supabaseUrl || !anon) {
      throw new Error("ვიდეოს ატვირთვისთვის სერვერის კონფიგი ვერ მოიძებნა");
    }

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `${supabaseUrl}/storage/v1/object/post-videos/${path}`,
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", anon);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 90);
        setUploadProgress(percent);
      };

      xhr.onerror = () => reject(new Error("ვიდეოს ატვირთვა ვერ მოხერხდა"));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("ვიდეოს ატვირთვა ვერ მოხერხდა"));
      };

      xhr.send(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || content.trim().length < 3) return;
    setInlineError(null);
    setPosting(true);
    setUploadProgress(5);

    let mediaKind: "none" | "image" | "video" = "none";
    let mediaUrls: string[] = [];
    let videoUrl: string | null = null;

    if (mediaMode === "video" && videoFile) {
      mediaKind = "video";
      const path = `${circleId}/${user.id}/${Date.now()}_${safeFileName(videoFile.name)}`;

      try {
        await uploadVideoWithProgress(path, videoFile);
        const {
          data: { publicUrl },
        } = supabase.storage.from("post-videos").getPublicUrl(path);
        videoUrl = publicUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "ვიდეოს ატვირთვა ვერ მოხერხდა";
        setInlineError(message);
        toast.error(message);
        setPosting(false);
        setUploadProgress(0);
        return;
      }
    } else if (images.length > 0) {
      mediaKind = "image";
      mediaUrls = [];
      for (const file of images) {
        const path = `${circleId}/${user.id}/${Date.now()}_${safeFileName(file.name)}`;
        const { error: uploadErr } = await supabase.storage
          .from("posts")
          .upload(path, file, { upsert: true });

        if (uploadErr) {
          toast.error("სურათის ატვირთვა ვერ მოხერხდა");
          setPosting(false);
          setUploadProgress(0);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("posts").getPublicUrl(path);
        mediaUrls.push(publicUrl);
      }
    }

    setUploadProgress(95);
    const { error } = await supabase.from("posts").insert({
      circle_id: circleId,
      author_id: user.id,
      type,
      content: content.trim(),
      media_urls: mediaUrls,
      media_kind: mediaKind,
      video_url: videoUrl,
    });

    if (error) {
      toast.error("პოსტი ვერ გაიგზავნა");
      setPosting(false);
      setUploadProgress(0);
      return;
    }

    setUploadProgress(100);
    toast.success("პოსტი გამოქვეყნდა!");
    setContent("");
    setType("story");
    clearImages();
    clearVideo();
    setMediaMode("images");
    setPosting(false);
    setUploadProgress(0);
    onPosted();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-card p-4">
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
                : "border-border text-muted-foreground hover:border-seal/30 hover:text-foreground",
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

      {inlineError && (
        <p className="text-xs text-destructive">{inlineError}</p>
      )}

      {videoPreview && (
        <div className="relative overflow-hidden rounded-lg border">
          <video
            src={videoPreview}
            className="aspect-video w-full bg-black"
            controls
            preload="metadata"
            playsInline
          />
          <button
            type="button"
            onClick={clearVideo}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt={`სურათი ${i + 1}`}
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

      {posting && mediaMode === "video" && videoFile && (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-seal transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            ვიდეო იტვირთება... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={posting || mediaMode === "video" || images.length >= 4}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <ImagePlus className="h-4 w-4" />
            ფოტო ({images.length}/4)
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={posting || images.length > 0 || !!videoFile}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Video className="h-4 w-4" />
            ვიდეო
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept={VIDEO_ACCEPT_ATTR}
            className="hidden"
            onChange={handleVideoSelect}
          />
        </div>

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
