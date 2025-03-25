
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityWithClientInfo } from '@/types/activity';
import { Badge } from '@/components/ui/badge';

export interface ActivityItemProps {
  activity: ActivityWithClientInfo;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  // Format the activity timestamp
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
  
  // Determine activity color based on type
  const getActivityColor = (type: string) => {
    if (type.includes('error') || type.includes('failed')) return 'destructive';
    if (type.includes('created') || type.includes('added')) return 'default'; // Changed from 'success' to 'default'
    if (type.includes('updated') || type.includes('completed')) return 'default';
    if (type.includes('deleted')) return 'secondary';
    return 'default';
  };

  // Format activity type for display
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="py-4 px-4 border-b last:border-b-0">
      <div className="flex justify-between items-start">
        <div className="flex flex-col space-y-1">
          <div className="font-medium text-sm">
            {activity.client_name && (
              <span className="text-muted-foreground mr-1">
                {activity.client_name}:
              </span>
            )}
            <span>{activity.description || formatActivityType(activity.activity_type)}</span>
          </div>
          <div className="flex space-x-2 items-center">
            <Badge variant={getActivityColor(activity.activity_type)}>
              {formatActivityType(activity.activity_type)}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
