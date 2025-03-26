
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClientActivity } from '@/types/activity';
import { Skeleton } from '@/components/ui/skeleton';

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
  onActivityClick
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
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
  }

  if (!activities.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No recent activity found
      </div>
    );
  }

  // Helper function to get appropriate icon for activity type
  const getActivityIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    if (type.includes('create') || type.includes('added')) {
      return <span className="text-green-500">+</span>;
    }
    if (type.includes('delete') || type.includes('removed')) {
      return <span className="text-red-500">-</span>;
    }
    if (type.includes('update') || type.includes('change')) {
      return <span className="text-blue-500">↻</span>;
    }
    
    // Default
    return <span className="text-gray-500">•</span>;
  };

  // Helper function to format activity description
  const formatActivityDescription = (activity: ClientActivity) => {
    const { activity_type, client_name } = activity;
    
    if (activity_type.includes('client_created')) {
      return `New client "${client_name || 'Unknown'}" was created`;
    }
    if (activity_type.includes('client_updated')) {
      return `Client "${client_name || 'Unknown'}" was updated`;
    }
    if (activity_type.includes('website_url_added')) {
      return `Website URL was added to client "${client_name || 'Unknown'}"`;
    }
    if (activity_type.includes('document_added') || activity_type.includes('document_uploaded')) {
      return `Document was added to client "${client_name || 'Unknown'}"`;
    }
    
    // Fallback to a readable version of the activity type
    return `${activity_type.replace(/_/g, ' ')} for ${client_name || 'Unknown'}`;
  };

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`flex items-start space-x-4 p-3 rounded-md transition-colors ${
            highlightedId === activity.id ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'
          }`}
          onClick={() => onActivityClick && onActivityClick(activity.id)}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {getActivityIcon(activity.activity_type)}
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{formatActivityDescription(activity)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
