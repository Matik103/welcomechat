
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Users, Settings, Link, UserPlus, Edit, Trash2, 
  RotateCcw, Upload, Eye, Code, Image, Bot, 
  Key, LogOut, FileText, Mail, ShieldAlert, Calendar
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

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
  const [resolvedClientName, setResolvedClientName] = useState<string | null>(null);
  
  // Fetch client name from ai_agents table if needed
  useEffect(() => {
    // Only fetch if we have a client_id but no proper client_name
    if (
      item.client_id && 
      (!item.client_name || 
       item.client_name === "Unknown Client" ||
       item.client_name.startsWith("Client ") ||
       /^[a-f0-9]{6,}$/i.test(item.client_name))
    ) {
      const fetchClientName = async () => {
        try {
          // Query ai_agents table to get the client name
          const { data, error } = await supabase
            .from('ai_agents')
            .select('name, settings->client_name as client_name, client_name as direct_client_name')
            .eq('client_id', item.client_id)
            .eq('interaction_type', 'config')
            .order('updated_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error("Error fetching client name:", error);
            return;
          }
          
          if (data && data.length > 0) {
            // Determine best client name from the result
            const agentData = data[0];
            const clientName = 
              (agentData.client_name && typeof agentData.client_name === 'string' && agentData.client_name.trim() !== '' 
                ? agentData.client_name 
                : null) || 
              (agentData.direct_client_name && typeof agentData.direct_client_name === 'string' && agentData.direct_client_name.trim() !== '' 
                ? agentData.direct_client_name 
                : null) || 
              (agentData.name && typeof agentData.name === 'string' && agentData.name.trim() !== '' 
                ? agentData.name 
                : null);
            
            if (clientName) {
              setResolvedClientName(clientName);
            }
          }
        } catch (err) {
          console.error("Error resolving client name:", err);
        }
      };
      
      fetchClientName();
    }
  }, [item.client_id, item.client_name]);
  
  // Get client name, with improved fallbacks
  const getClientName = (): string => {
    // First, use our resolved name from the database if we have it
    if (resolvedClientName) {
      return resolvedClientName;
    }
    
    // Next check for the client_name from our enriched data
    if (item.client_name && typeof item.client_name === 'string' && item.client_name.trim().length > 0) {
      // Check if it's not an ID-like string or "Unknown Client"
      if (
        item.client_name !== "Unknown Client" && 
        !item.client_name.startsWith("Client ") &&
        !/^[a-f0-9]{6,}$/i.test(item.client_name)
      ) {
        return item.client_name;
      }
    }
    
    // Then check metadata for client_name
    if (item.metadata && typeof item.metadata === 'object' && item.metadata !== null) {
      const metadata = item.metadata as Record<string, any>;
      
      // Try client_name first
      if (metadata.client_name && typeof metadata.client_name === 'string' && metadata.client_name.trim().length > 0) {
        const mdClientName = String(metadata.client_name);
        if (!/^[a-f0-9]{6,}$/i.test(mdClientName) && mdClientName !== "Unknown Client") {
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
    
    // For system updates or activities without a client
    if (!item.client_id || item.activity_type === 'system_update') {
      return "System";
    }
    
    // As a last resort, format the ID nicely instead of showing "Unknown Client"
    if (item.client_id) {
      return "Client " + item.client_id.substring(0, 6);
    }
    
    return "System Activity";
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
