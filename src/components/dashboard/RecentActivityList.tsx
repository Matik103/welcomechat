import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar,
  AlertCircle, Check, File, MessageSquare, Globe, 
  FileCheck, FileWarning, FileMinus, FilePlus, Layout,
  CheckCircle, LogIn
} from 'lucide-react';
import { activityTypeToIcon, activityTypeToColor, getActivityTypeLabel } from '@/utils/activityTypeUtils';

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

  const getActivityIcon = (activityType: string = 'unknown') => {
    if (activityTypeToIcon[activityType]) {
      const iconName = activityTypeToIcon[activityType];
      
      switch (iconName) {
        case 'users': return <Users className="h-4 w-4" />;
        case 'settings': return <Settings className="h-4 w-4" />;
        case 'link': return <Link className="h-4 w-4" />;
        case 'link-2': return <Link className="h-4 w-4" />;
        case 'user-plus': return <UserPlus className="h-4 w-4" />;
        case 'user': return <Users className="h-4 w-4" />;
        case 'user-x': return <Users className="h-4 w-4" />;
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
        case 'log-in': return <LogIn className="h-4 w-4" />;
        case 'file-text': return <FileText className="h-4 w-4" />;
        case 'file-plus': return <FilePlus className="h-4 w-4" />;
        case 'file-minus': return <FileMinus className="h-4 w-4" />;
        case 'file-check': return <FileCheck className="h-4 w-4" />;
        case 'file-warning': return <FileWarning className="h-4 w-4" />;
        case 'mail': return <Mail className="h-4 w-4" />;
        case 'alert-circle': return <AlertCircle className="h-4 w-4" />;
        case 'calendar': return <Calendar className="h-4 w-4" />;
        case 'check': return <Check className="h-4 w-4" />;
        case 'check-circle': return <CheckCircle className="h-4 w-4" />;
        case 'file': return <File className="h-4 w-4" />;
        case 'globe': return <Globe className="h-4 w-4" />;
        case 'layout': return <Layout className="h-4 w-4" />;
        default: return <MessageSquare className="h-4 w-4" />;
      }
    }
    
    if (activityType.includes('create') || activityType.includes('added')) {
      return <UserPlus className="h-4 w-4 text-green-500" />;
    }
    if (activityType.includes('delete') || activityType.includes('removed')) {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    if (activityType.includes('update') || activityType.includes('change') || activityType.includes('edited')) {
      return <Edit className="h-4 w-4 text-blue-500" />;
    }
    if (activityType.includes('error') || activityType.includes('failed')) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (activityType.includes('document') || activityType.includes('file')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (activityType.includes('chat') || activityType.includes('message') || activityType.includes('interaction')) {
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    }
    if (activityType.includes('agent') || activityType.includes('ai_agent')) {
      return <Bot className="h-4 w-4 text-indigo-500" />;
    }
    
    return <MessageSquare className="h-4 w-4 text-gray-500" />;
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
        const activityColor = activityTypeToColor[activityType] || 'gray';
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
