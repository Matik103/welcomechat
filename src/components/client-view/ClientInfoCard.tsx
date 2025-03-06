
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ChatInteraction } from "@/types/agent";
import { InteractionStats } from "@/types/client-dashboard";

interface ClientInfoCardProps {
  client: any;
  chatHistory: ChatInteraction[] | undefined;
  stats?: InteractionStats | null;
  isLoadingStats?: boolean;
}

export const ClientInfoCard = ({ client, chatHistory, stats, isLoadingStats = false }: ClientInfoCardProps) => {
  // Calculate time since last activity
  const lastActivity = chatHistory && chatHistory.length > 0 
    ? new Date(chatHistory[0].metadata.timestamp) 
    : client.last_active 
      ? new Date(client.last_active)
      : null;
  
  const timeSinceLastActivity = lastActivity 
    ? formatTimeSince(lastActivity) 
    : "No activity recorded";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Agent Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Client Name</p>
            <p className="font-medium">{client.client_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Agent Name</p>
            <p className="font-medium">{client.agent_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Activity</p>
            <p className="font-medium">{timeSinceLastActivity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">
              {client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <p className="text-sm font-medium mb-3">Agent Performance</p>
          
          {isLoadingStats ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Interactions</p>
                <p className="text-xl font-bold">{stats?.total_interactions || 0}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Active Days</p>
                <p className="text-xl font-bold">{stats?.active_days || 0}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Avg Response Time</p>
                <p className="text-xl font-bold">{stats?.average_response_time || 0}s</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Common Topics</p>
                <p className="text-xl font-bold">{stats?.top_queries?.length || 0}</p>
              </div>
            </div>
          )}
        </div>

        {client.description && (
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium mb-2">Description</p>
            <p className="text-sm text-gray-600">{client.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to format time since
function formatTimeSince(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  
  return format(date, 'MMM d, yyyy');
}
