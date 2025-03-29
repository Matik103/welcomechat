
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityIcon } from './ActivityIcon';
import { activityTypeToColor, getActivityTypeLabel } from '@/utils/activityTypeUtils';
import { formatActivityDescription } from '@/utils/activityDescriptionUtil';
import { ClientActivity } from '@/types/activity';

interface ActivityItemProps {
  activity: ClientActivity;
  isHighlighted: boolean;
  onClick: (id: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ 
  activity, 
  isHighlighted,
  onClick 
}) => {
  const activityType = activity.type || 'unknown';
  const activityColor = activityTypeToColor[activityType] || 'gray';
  const bgColorClass = `bg-${activityColor}-100`;
  
  return (
    <div
      className={`flex items-start space-x-4 p-3 rounded-md transition-colors ${
        isHighlighted ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'
      }`}
      onClick={() => onClick(activity.id)}
    >
      <div className={`h-10 w-10 rounded-full ${bgColorClass} flex items-center justify-center`}>
        <ActivityIcon activityType={activityType} />
      </div>
      
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{formatActivityDescription(activity)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
        <p className="text-xs font-mono text-muted-foreground">
          {getActivityTypeLabel(activityType)}
        </p>
      </div>
    </div>
  );
};
