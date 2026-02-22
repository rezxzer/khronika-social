import { cn } from "@/lib/utils";

type PostType = "story" | "lesson" | "invite";

const labels: Record<PostType, string> = {
  story: "ამბავი",
  lesson: "სწავლება",
  invite: "მოწვევა",
};

export function PostTypeBadge({
  type,
  className,
}: {
  type: PostType;
  className?: string;
}) {
  const isInvite = type === "invite";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        isInvite
          ? "border-seal/40 text-seal"
          : "border-border text-muted-foreground",
        className
      )}
    >
      {!isInvite && (
        <span className="h-1.5 w-1.5 rounded-full bg-seal/50" />
      )}
      {labels[type]}
    </span>
  );
}
