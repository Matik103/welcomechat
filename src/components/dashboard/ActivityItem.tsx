
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  Bot, MessageSquare, File, FileText, AlertCircle, 
  Globe, CheckCircle, FilePlus, FileCheck, FileWarning,
  FileMinus, LogIn, LogOut, Key
} from 'lucide-react';
import { activityTypeToIcon, activityTypeToColor } from '@/utils/activityTypeUtils';
import type { Json } from '@/integrations/supabase/types';

interface ActivityItemProps {
  item: {
    id?: string;
    type?: string; // Now using type instead of activity_type
    activity_type?: string; // For backward compatibility
    description: string;
    created_at: string;
    metadata?: Json;
  };
}

export const ActivityItem = ({ item }: ActivityItemProps) => {
  const activityType = item.type || item.activity_type || 'unknown';
  const iconName = activityTypeToIcon[activityType] || activityTypeToIcon.default;
  const colorName = activityTypeToColor[activityType] || activityTypeToColor.default;
  
  const getIcon = () => {
    switch (iconName) {
      case 'users': return <Users size={16} />;
      case 'settings': return <Settings size={16} />;
      case 'link': return <Link size={16} />;
      case 'user-plus': return <UserPlus size={16} />;
      case 'edit': return <Edit size={16} />;
      case 'trash': return <Trash2 size={16} />;
      case 'bot': return <Bot size={16} />;
      case 'message-square': return <MessageSquare size={16} />;
      case 'file': return <File size={16} />;
      case 'file-plus': return <FilePlus size={16} />;
      case 'file-check': return <FileCheck size={16} />;
      case 'file-warning': return <FileWarning size={16} />;
      case 'file-minus': return <FileMinus size={16} />;
      case 'file-text': return <FileText size={16} />;
      case 'alert-circle': return <AlertCircle size={16} />;
      case 'globe': return <Globe size={16} />;
      case 'check-circle': return <CheckCircle size={16} />;
      case 'log-in': return <LogIn size={16} />;
      case 'log-out': return <LogOut size={16} />;
      case 'key': return <Key size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const getColorClasses = () => {
    switch (colorName) {
      case 'green': return 'bg-green-100 text-green-600';
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'red': return 'bg-red-100 text-red-600';
      case 'indigo': return 'bg-indigo-100 text-indigo-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'amber': return 'bg-amber-100 text-amber-600';
      case 'gray': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = () => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown time';
    }
  };

  return (
    <div className="flex items-start space-x-3 mb-3 pb-3 border-b border-gray-100 last:border-0">
      <div className={`flex-shrink-0 rounded-full p-2 ${getColorClasses()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.description}</p>
        <p className="text-xs text-gray-500 mt-1">{getRelativeTime()}</p>
        {item.metadata && (
          <p className="text-xs text-gray-400 mt-1 truncate max-w-full">
            {Object.keys(item.metadata as Record<string, any>).length > 0 
              ? `Details: ${JSON.stringify(item.metadata).substring(0, 50)}...` 
              : ''}
          </p>
        )}
      </div>
    </div>
  );
};
