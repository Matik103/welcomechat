
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg p-4 border">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-4 border">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>

        <div className="bg-card rounded-lg p-4 border">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60 mb-4" />
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-40 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Skeleton */}
      <div className="bg-card rounded-lg p-4 border">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-60 mb-4" />
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-4 p-3 rounded-md">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
