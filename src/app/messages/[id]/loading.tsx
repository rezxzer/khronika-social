import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div className="flex items-center gap-3 border-b pb-3">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex-1 space-y-3 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t pt-3">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}
