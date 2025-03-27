
import React from "react";
import { format } from "date-fns";
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar,
  Globe, FilePlus, FileMinus, FileCheck, FileWarning,
  CheckCircle, AlertCircle, LogIn
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { activityTypeToIcon, getActivityTypeLabel } from '@/utils/activityTypeUtils';

interface ActivityItemProps {
  item: {
    activity_type: string;
    description: string;
    created_at: string;
    metadata: Json;
    client_name?: string;
    client_id?: string;
    client_email?: string;
    agent_name?: string;
    agent_description?: string;
  };
}

const getActivityIcon = (type: string, metadata: Json) => {
  // Check if there's an original activity type in metadata
  const originalType = metadata && 
    typeof metadata === 'object' && 
    metadata !== null && 
    'original_activity_type' in metadata ? 
    (metadata.original_activity_type as string) : 
    undefined;
  
  // Use the original type if it exists, otherwise use the provided type
  const activityType = originalType || type;
  
  // Use our new utility function to get the icon name
  const iconName = activityTypeToIcon[activityType] || 'users';
  
  // Return the appropriate icon component
  switch (iconName) {
    case 'user-plus': return <UserPlus className="w-4 h-4 text-primary" />;
    case 'edit': return <Edit className="w-4 h-4 text-primary" />;
    case 'trash': return <Trash2 className="w-4 h-4 text-destructive" />;
    case 'rotate-ccw': return <RotateCcw className="w-4 h-4 text-green-500" />;
    case 'settings': return <Settings className="w-4 h-4 text-primary" />;
    case 'link': case 'link-2': return <Link className="w-4 h-4 text-primary" />;
    case 'upload': return <Upload className="w-4 h-4 text-primary" />;
    case 'image': return <Image className="w-4 h-4 text-primary" />;
    case 'code': return <Code className="w-4 h-4 text-primary" />;
    case 'eye': return <Eye className="w-4 h-4 text-primary" />;
    case 'bot': return <Bot className="w-4 h-4 text-primary" />;
    case 'key': return <Key className="w-4 h-4 text-primary" />;
    case 'log-out': return <LogOut className="w-4 h-4 text-primary" />;
    case 'log-in': return <LogIn className="w-4 h-4 text-primary" />;
    case 'file-text': return <FileText className="w-4 h-4 text-primary" />;
    case 'file-plus': return <FilePlus className="w-4 h-4 text-primary" />;
    case 'file-minus': return <FileMinus className="w-4 h-4 text-primary" />;
    case 'file-check': return <FileCheck className="w-4 h-4 text-primary" />;
    case 'file-warning': return <FileWarning className="w-4 h-4 text-primary" />;
    case 'mail': return <Mail className="w-4 h-4 text-primary" />;
    case 'shield-alert': return <ShieldAlert className="w-4 h-4 text-destructive" />;
    case 'calendar': return <Calendar className="w-4 h-4 text-primary" />;
    case 'globe': return <Globe className="w-4 h-4 text-primary" />;
    case 'check-circle': return <CheckCircle className="w-4 h-4 text-primary" />;
    case 'alert-circle': return <AlertCircle className="w-4 h-4 text-destructive" />;
    case 'users': default: return <Users className="w-4 h-4 text-primary" />;
  }
};

export const ActivityItem = ({ item }: ActivityItemProps) => {
  // Use the properly resolved client name that comes from useRecentActivities hook
  const clientName = item.client_name || "System";
  // Get a human-readable label for the activity type
  const activityTypeLabel = getActivityTypeLabel(item.activity_type);
    
  return (
    <div className="flex items-center gap-4 py-3 animate-slide-in">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        {getActivityIcon(item.activity_type, item.metadata)}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">
          {clientName} {item.description}
        </p>
        <p className="text-xs text-gray-500">
          {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')} • {activityTypeLabel}
        </p>
      </div>
    </div>
  );
};
