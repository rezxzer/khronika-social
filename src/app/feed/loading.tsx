import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
