
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityLoadingSkeletonProps {
  count?: number;
}

export const ActivityLoadingSkeleton: React.FC<ActivityLoadingSkeletonProps> = ({ 
  count = 5 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-3 animate-pulse">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
};
