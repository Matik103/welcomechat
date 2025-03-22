
import React from "react";
import { format } from "date-fns";
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

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
  // Safely check if there's an original activity type in metadata
  const originalType = metadata && 
    typeof metadata === 'object' && 
    metadata !== null && 
    'original_activity_type' in metadata ? 
    (metadata.original_activity_type as string) : 
    undefined;
  
  // Use the original type if it exists, otherwise use the provided type
  const activityType = originalType || type;
  
  switch (activityType) {
    case 'client_created':
      return <UserPlus className="w-4 h-4 text-primary" />;
    case 'client_updated':
      return <Edit className="w-4 h-4 text-primary" />;
    case 'client_deleted':
      return <Trash2 className="w-4 h-4 text-destructive" />;
    case 'client_recovered':
      return <RotateCcw className="w-4 h-4 text-green-500" />;
    case 'widget_settings_updated':
      return <Settings className="w-4 h-4 text-primary" />;
    case 'website_url_added':
    case 'drive_link_added':
    case 'document_link_added':
      return <Link className="w-4 h-4 text-primary" />;
    case 'website_url_removed':
    case 'drive_link_removed':
    case 'url_deleted':
    case 'drive_link_deleted':
    case 'document_link_deleted':
      return <Trash2 className="w-4 h-4 text-primary" />;
    case 'document_uploaded':
      return <Upload className="w-4 h-4 text-primary" />;
    case 'logo_uploaded':
      return <Image className="w-4 h-4 text-primary" />;
    case 'embed_code_copied':
      return <Code className="w-4 h-4 text-primary" />;
    case 'widget_previewed':
      return <Eye className="w-4 h-4 text-primary" />;
    case 'ai_agent_created':
    case 'ai_agent_updated':
      return <Bot className="w-4 h-4 text-primary" />;
    case 'password_changed':
    case 'password_reset':
      return <Key className="w-4 h-4 text-primary" />;
    case 'signed_out':
      return <LogOut className="w-4 h-4 text-primary" />;
    case 'document_viewed':
      return <FileText className="w-4 h-4 text-primary" />;
    case 'email_sent':
      return <Mail className="w-4 h-4 text-primary" />;
    case 'security_alert':
      return <ShieldAlert className="w-4 h-4 text-destructive" />;
    case 'scheduled_event':
      return <Calendar className="w-4 h-4 text-primary" />;
    case 'chat_interaction':
      return <Bot className="w-4 h-4 text-primary" />;
    default:
      return <Users className="w-4 h-4 text-primary" />;
  }
};

export const ActivityItem = ({ item }: ActivityItemProps) => {
  // Get client name, with improved fallbacks
  const getClientName = (): string => {
    // First check for the client_name from our enriched data
    if (item.client_name && typeof item.client_name === 'string' && item.client_name.trim().length > 0) {
      // Check if it's not an ID-like string (e.g., "4f85a4", "bfe4c5")
      const looksLikeId = /^[a-f0-9]{6,}$/i.test(item.client_name);
      if (!looksLikeId) {
        return item.client_name;
      }
    }
    
    // Then check metadata for client_name
    if (item.metadata && typeof item.metadata === 'object' && item.metadata !== null) {
      const metadata = item.metadata as Record<string, any>;
      
      // Try client_name first
      if (metadata.client_name && typeof metadata.client_name === 'string' && metadata.client_name.trim().length > 0) {
        const mdClientName = String(metadata.client_name);
        if (!/^[a-f0-9]{6,}$/i.test(mdClientName)) {
          return mdClientName;
        }
      }
      
      // Try name as fallback
      if (metadata.name && typeof metadata.name === 'string' && metadata.name.trim().length > 0) {
        return String(metadata.name);
      }
    }
    
    // Use agent_name if available
    if (item.agent_name && typeof item.agent_name === 'string' && item.agent_name.trim().length > 0) {
      return item.agent_name;
    }
    
    // As a last resort, use "Unknown Client" instead of ID
    return "Unknown Client";
  };
  
  const clientName = getClientName();
    
  return (
    <div className="flex items-center gap-4 py-3 animate-slide-in">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        {getActivityIcon(item.activity_type, item.metadata)}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{clientName}</span>{" "}
          {item.description}
        </p>
        <p className="text-xs text-gray-500">{format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}</p>
      </div>
    </div>
  );
};
