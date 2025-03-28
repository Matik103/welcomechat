import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar,
  AlertCircle, Check, File, MessageSquare, Globe, 
  FileCheck, FileWarning, FileMinus, FilePlus, Layout,
  XCircle, MessageCircle, HelpCircle
} from 'lucide-react';
import { activityTypeIcons, activityTypeColors, getActivityTypeLabel } from '@/utils/activityTypeUtils';

interface ClientActivity {
  id: string;
  client_id: string;
  client_name?: string;
  description: string;
  created_at: string;
  metadata: any;
  type?: string;
}

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

  const getActivityIcon = (activityType: string) => {
    const iconName = activityTypeIcons[activityType] || 'help-circle';
    
    switch (iconName) {
      case 'file-plus': return <FilePlus className="h-4 w-4" />;
      case 'file-minus': return <FileMinus className="h-4 w-4" />;
      case 'check-circle': return <CheckCircle className="h-4 w-4" />;
      case 'x-circle': return <XCircle className="h-4 w-4" />;
      case 'globe': return <Globe className="h-4 w-4" />;
      case 'globe-off': return <GlobeOff className="h-4 w-4" />;
      case 'message-square': return <MessageSquare className="h-4 w-4" />;
      case 'message-circle': return <MessageCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const formatActivityDescription = (activity: ClientActivity) => {
    const { type, client_name, description } = activity;
    
    if (description && description.length > 0) {
      return description;
    }
    
    const activityType = type || 'unknown';
    
    if (activityType.includes('client_created')) {
      return `New client "${client_name || 'Unknown'}" was created`;
    }
    if (activityType.includes('client_updated')) {
      return `Client "${client_name || 'Unknown'}" was updated`;
    }
    if (activityType.includes('agent_created') || activityType.includes('ai_agent_created')) {
      return `New AI agent was created for client "${client_name || 'Unknown'}"`;
    }
    if (activityType.includes('agent_updated') || activityType.includes('ai_agent_updated')) {
      return `AI agent was updated for client "${client_name || 'Unknown'}"`;
    }
    if (activityType.includes('website_url_added')) {
      return `Website URL was added to client "${client_name || 'Unknown'}"`;
    }
    if (activityType.includes('document_added') || activityType.includes('document_uploaded')) {
      return `Document was added to client "${client_name || 'Unknown'}"`;
    }
    if (activityType.includes('document_link_added')) {
      return `Document link was added to client "${client_name || 'Unknown'}"`;
    }
    if (activityType.includes('document_link_removed') || activityType.includes('document_link_deleted')) {
      return `Document link was removed from client "${client_name || 'Unknown'}"`;
    }
    if (activityType.includes('chat_interaction')) {
      return `Chat interaction with client "${client_name || 'Unknown'}"`;
    }
    
    return `${activityType.replace(/_/g, ' ')} for ${client_name || 'Unknown'}`;
  };

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const activityType = activity.type || 'unknown';
        const activityColor = activityTypeColors[activityType] || 'gray';
        const bgColorClass = `bg-${activityColor}-100`;
        const textColorClass = `text-${activityColor}-500`;
        
        return (
          <div
            key={activity.id}
            className={`flex items-start space-x-4 p-3 rounded-md transition-colors ${
              highlightedId === activity.id ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'
            }`}
            onClick={() => onActivityClick && onActivityClick(activity.id)}
          >
            <div className={`h-10 w-10 rounded-full ${bgColorClass} flex items-center justify-center`}>
              {getActivityIcon(activityType)}
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
      })}
    </div>
  );
};
