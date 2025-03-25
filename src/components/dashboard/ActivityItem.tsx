
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityWithClientInfo, ActivityType, ActivityLogEntry } from '@/types/activity';
import { User, Clock } from 'lucide-react';

const activityTypeToLabel = {
  client_created: 'Client Created',
  client_updated: 'Client Updated',
  client_deleted: 'Client Deleted',
  document_added: 'Document Added',
  document_processed: 'Document Processed',
  document_processing_failed: 'Document Processing Failed',
  document_link_added: 'Document Link Added',
  document_link_deleted: 'Document Link Deleted',
  signed_out: 'Signed Out',
  embed_code_copied: 'Embed Code Copied',
  chat_interaction: 'Chat Interaction',
  chat_message_received: 'Message Received',
};

// Add types to support both activity types
type ActivityItemProps = {
  activity: ActivityWithClientInfo | ActivityLogEntry;
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const clientName = 'client_name' in activity ? activity.client_name : (activity.ai_agents?.client_name || 'Unknown Client');
  
  // Format the date for display
  const formattedDate = activity.created_at 
    ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
    : 'recently';

  // Get activity type label
  const activityTypeLabel = activityTypeToLabel[activity.activity_type as keyof typeof activityTypeToLabel] || activity.activity_type;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors group">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.description || activityTypeLabel}
          </p>
          
          <div className="flex items-center mt-1">
            <User className="h-3.5 w-3.5 text-gray-400 mr-1" />
            <p className="text-xs text-gray-500 truncate">{clientName}</p>
            <span className="mx-1.5 text-gray-300">•</span>
            <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" />
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
