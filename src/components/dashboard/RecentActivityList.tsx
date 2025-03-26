
import React from 'react';
import { ClientActivity } from '@/types/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ActivityType } from '@/types/client-form';

interface ActivityIconProps {
  type: ActivityType;
}

const ActivityIcon: React.FC<ActivityIconProps> = ({ type }) => {
  // Determine color and icon based on activity type
  let bgColor = 'bg-blue-100';
  let textColor = 'text-blue-700';
  let icon = '📝';

  if (type.includes('created')) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
    icon = '✨';
  } else if (type.includes('deleted')) {
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    icon = '🗑️';
  } else if (type.includes('updated')) {
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    icon = '📝';
  } else if (type.includes('login')) {
    bgColor = 'bg-purple-100';
    textColor = 'text-purple-700';
    icon = '🔑';
  }

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} ${textColor}`}>
      {icon}
    </div>
  );
};

interface RecentActivityListProps {
  activities: ClientActivity[];
  isLoading: boolean;
  highlightedId: number | null;
  onActivityClick: (id: number) => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  isLoading,
  highlightedId,
  onActivityClick
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No recent activities found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
            activity.id === highlightedId ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'
          }`}
          onClick={() => onActivityClick(activity.id)}
        >
          <ActivityIcon type={activity.activity_type} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm line-clamp-2">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Client ID: {activity.client_id ? activity.client_id.substring(0, 8) : 'N/A'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
};
