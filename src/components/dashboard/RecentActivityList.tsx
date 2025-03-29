
import React from 'react';
import { ClientActivity } from '@/types/activity';
import { ActivityItem } from './ActivityItem';
import { ActivityLoadingSkeleton } from './ActivityLoadingSkeleton';

interface RecentActivityListProps {
  activities: ClientActivity[];
  isLoading: boolean;
  highlightedId?: string | null;
  onActivityClick?: (id: string) => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  isLoading,
  highlightedId,
  onActivityClick = () => {}
}) => {
  if (isLoading) {
    return <ActivityLoadingSkeleton />;
  }

  if (!activities.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No recent activity found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          isHighlighted={activity.id === highlightedId}
          onClick={onActivityClick}
        />
      ))}
    </div>
  );
};
