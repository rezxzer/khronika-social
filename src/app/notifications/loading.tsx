import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
