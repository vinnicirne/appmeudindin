import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 gap-6 w-full max-w-5xl mx-auto h-full min-h-[300px]">
      {/* Top Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[120px] w-full rounded-2xl hidden sm:block" />
        <Skeleton className="h-[120px] w-full rounded-2xl hidden sm:block" />
      </div>
      
      {/* Filters/Tabs Skeleton */}
      <div className="flex items-center gap-2 mt-4">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* List Skeleton */}
      <div className="flex flex-col gap-3 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
