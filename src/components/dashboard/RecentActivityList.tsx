
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { CircleUser, MessageSquare, FileText } from 'lucide-react';

interface Activity {
  id: string | number;
  type: string;
  metadata?: any;
  created_at: string;
  ai_agent_id?: string;
  client_name?: string;
}

interface RecentActivityListProps {
  activities: Activity[];
  isLoading: boolean;
  highlightedId: string | number | null;
  onActivityClick: (id: string | number) => void;
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
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No recent activity found
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    if (type.includes('chat')) {
      return <MessageSquare className="h-4 w-4" />;
    } else if (type.includes('document')) {
      return <FileText className="h-4 w-4" />;
    }
    return <CircleUser className="h-4 w-4" />;
  };

  const getActivityDescription = (activity: Activity) => {
    let description = 'Performed an action';
    
    if (activity.type.includes('message_received')) {
      description = `New chat message${activity.metadata?.query ? `: "${activity.metadata.query}"` : ''}`;
    } else if (activity.type.includes('document_added')) {
      description = `Added document${activity.metadata?.name ? `: ${activity.metadata.name}` : ''}`;
    } else if (activity.type.includes('document_processed')) {
      description = `Processed document${activity.metadata?.name ? `: ${activity.metadata.name}` : ''}`;
    }
    
    return description;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const isHighlighted = activity.id === highlightedId;
        return (
          <div
            key={activity.id}
            className={`flex items-start space-x-4 p-2 rounded-md cursor-pointer transition-colors ${
              isHighlighted ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => onActivityClick(activity.id)}
          >
            <Avatar>
              <AvatarFallback>
                {getActivityIcon(activity.type)}
              </AvatarFallback>
              <AvatarImage src="" />
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {activity.client_name || `Client ${activity.ai_agent_id?.substring(0, 8)}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {getActivityDescription(activity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
