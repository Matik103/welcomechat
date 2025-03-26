import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClientActivity } from '@/types/activity';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar,
  AlertCircle, Check, File, MessageSquare
} from 'lucide-react';
import { activityTypeToIcon, activityTypeToColor } from '@/utils/activityTypeUtils';

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
    // First check if we have a predefined icon in our utility
    if (activityTypeToIcon[type]) {
      const iconName = activityTypeToIcon[type];
      
      // Map string icon names to actual Lucide components
      switch (iconName) {
        case 'users': return <Users className="h-4 w-4" />;
        case 'settings': return <Settings className="h-4 w-4" />;
        case 'link': return <Link className="h-4 w-4" />;
        case 'user-plus': return <UserPlus className="h-4 w-4" />;
        case 'edit': return <Edit className="h-4 w-4" />;
        case 'trash': return <Trash2 className="h-4 w-4" />;
        case 'rotate-ccw': return <RotateCcw className="h-4 w-4" />;
        case 'upload': return <Upload className="h-4 w-4" />;
        case 'eye': return <Eye className="h-4 w-4" />;
        case 'code': return <Code className="h-4 w-4" />;
        case 'image': return <Image className="h-4 w-4" />;
        case 'bot': return <Bot className="h-4 w-4" />;
        case 'key': return <Key className="h-4 w-4" />;
        case 'log-out': return <LogOut className="h-4 w-4" />;
        case 'file-text': return <FileText className="h-4 w-4" />;
        case 'mail': return <Mail className="h-4 w-4" />;
        case 'alert-circle': return <AlertCircle className="h-4 w-4" />;
        case 'calendar': return <Calendar className="h-4 w-4" />;
        case 'check': return <Check className="h-4 w-4" />;
        case 'file': return <File className="h-4 w-4" />;
        default: return <MessageSquare className="h-4 w-4" />;
      }
    }
    
    // Fallback logic based on keywords in activity type
    if (type.includes('create') || type.includes('added')) {
      return <UserPlus className="h-4 w-4 text-green-500" />;
    }
    if (type.includes('delete') || type.includes('removed')) {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    if (type.includes('update') || type.includes('change') || type.includes('edited')) {
      return <Edit className="h-4 w-4 text-blue-500" />;
    }
    if (type.includes('error') || type.includes('failed')) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (type.includes('document') || type.includes('file')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (type.includes('chat') || type.includes('message') || type.includes('interaction')) {
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    }
    
    // Default
    return <MessageSquare className="h-4 w-4 text-gray-500" />;
  };

  // Helper function to get color for activity type
  const getActivityColor = (type: string): string => {
    return activityTypeToColor[type] || 'gray';
  };

  // Helper function to format activity description
  const formatActivityDescription = (activity: ClientActivity) => {
    const { activity_type, client_name, description } = activity;
    
    // If there's already a description, use it
    if (description && description.length > 0) {
      return description;
    }
    
    // Otherwise, generate a description based on activity type
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
    if (activity_type.includes('chat_interaction')) {
      return `Chat interaction with client "${client_name || 'Unknown'}"`;
    }
    
    // Fallback to a readable version of the activity type
    return `${activity_type.replace(/_/g, ' ')} for ${client_name || 'Unknown'}`;
  };

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const activityColor = getActivityColor(activity.activity_type);
        const colorClass = `text-${activityColor}-500`;
        
        return (
          <div
            key={activity.id}
            className={`flex items-start space-x-4 p-3 rounded-md transition-colors ${
              highlightedId === activity.id ? 'bg-muted' : 'hover:bg-muted/50 cursor-pointer'
            }`}
            onClick={() => onActivityClick && onActivityClick(activity.id)}
          >
            <div className={`h-10 w-10 rounded-full bg-${activityColor}-100 flex items-center justify-center`}>
              {getActivityIcon(activity.activity_type)}
            </div>
            
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{formatActivityDescription(activity)}</p>
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
