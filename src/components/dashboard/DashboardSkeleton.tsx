
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action Buttons Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-[160px] w-full rounded-lg" />
        ))}
      </div>
      
      {/* Activity Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      
      {/* Recent Activities Skeleton */}
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );
}
