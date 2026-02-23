"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export type PostType = "story" | "lesson" | "invite";

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: "story", label: "ამბავი" },
  { value: "lesson", label: "სწავლება" },
  { value: "invite", label: "მოწვევა" },
];

interface PostEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialContent: string;
  initialType: PostType;
  mediaUrls?: string[];
  mediaKind?: "none" | "image" | "video";
  videoUrl?: string | null;
  onSaved: (newContent: string, newType: PostType) => void;
}

export function PostEditDialog({
  open,
  onOpenChange,
  postId,
  initialContent,
  initialType,
  mediaUrls,
  mediaKind,
  videoUrl,
  onSaved,
}: PostEditDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState<PostType>(initialType);
  const [saving, setSaving] = useState(false);

  const changed = content.trim() !== initialContent || type !== initialType;
  const valid = content.trim().length >= 3;

  async function handleSave() {
    if (!valid || !changed) return;
    setSaving(true);

    const { error } = await supabase
      .from("posts")
      .update({ content: content.trim(), type })
      .eq("id", postId);

    if (error) {
      toast.error("პოსტის განახლება ვერ მოხერხდა");
    } else {
      toast.success("პოსტი განახლდა");
      onSaved(content.trim(), type);
      onOpenChange(false);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">
            პოსტის რედაქტირება
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  type === opt.value
                    ? "border-seal bg-seal/10 text-seal"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="min-h-[120px] resize-none"
            placeholder="პოსტის ტექსტი..."
          />

          {mediaKind === "video" && videoUrl && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                ვიდეო (რედაქტირება შემდეგ ვერსიაში)
              </p>
              <video
                src={videoUrl}
                className="aspect-video w-full rounded-lg border bg-black"
                controls
                preload="metadata"
                playsInline
              />
            </div>
          )}

          {mediaKind !== "video" && mediaUrls && mediaUrls.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                მედია (წაშლა/დამატება შემდეგ ვერსიაში)
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {mediaUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              გაუქმება
            </Button>
            <Button
              variant="seal"
              size="sm"
              onClick={handleSave}
              disabled={!valid || !changed || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "შენახვა"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
