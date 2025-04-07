
import React from "react";
import { Calendar, Users, Activity, Bot, Globe, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ClientInfoCardProps {
  client: any;
  chatHistory: any[];
  aiAgentStats?: any;
}

export function ClientInfoCard({ client, chatHistory, aiAgentStats }: ClientInfoCardProps) {
  // Calculate last active time with better fallbacks
  const lastActive = client.last_active 
    ? new Date(client.last_active).toLocaleString() 
    : chatHistory.length > 0 
      ? new Date(chatHistory[0].created_at).toLocaleString()
      : "No activity yet";
  
  // Calculate days since creation with validation
  const createdDate = client.created_at ? new Date(client.created_at) : null;
  const today = new Date();
  const daysSinceCreation = createdDate && !isNaN(createdDate.getTime())
    ? Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Stats from ai_agents if available
  const totalInteractions = aiAgentStats?.total_interactions || chatHistory.length || 0;
  const activeDays = aiAgentStats?.active_days || 0;
  const avgResponseTime = aiAgentStats?.average_response_time || 0;

  // Get client name and agent name with proper fallbacks
  const clientName = client.client_name || "";
  const agentName = client.name || client.agent_name || "";
  
  // Format date properly for display
  const formattedCreatedDate = createdDate && !isNaN(createdDate.getTime())
    ? createdDate.toLocaleDateString()
    : "Not available";

  // Determine client status with fallback
  const clientStatus = client.status || 'active';
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (!clientName) return 'CL';
    return clientName
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {client.logo_url ? (
              <AvatarImage 
                src={client.logo_url} 
                alt={clientName}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            {clientName}
          </CardTitle>
        </div>
        <Badge variant={clientStatus === 'active' ? "default" : "destructive"} className={clientStatus === 'active' ? "bg-green-500 hover:bg-green-600" : ""}>
          {clientStatus}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">AI Agent</h3>
              <p className="font-semibold flex items-center gap-1">
                <Bot className="h-3 w-3" /> {agentName}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
              <p className="font-semibold flex items-center gap-1">
                <Activity className="h-3 w-3" /> {lastActive}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formattedCreatedDate}
              </p>
              {daysSinceCreation > 0 && (
                <p className="text-xs text-gray-500">{daysSinceCreation} days ago</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-blue-50 p-3 rounded-md">
              <h3 className="text-xs font-medium text-blue-700">Interactions</h3>
              <p className="text-xl font-bold text-blue-800">{totalInteractions}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <h3 className="text-xs font-medium text-green-700">Active Days</h3>
              <p className="text-xl font-bold text-green-800">{activeDays}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md">
              <h3 className="text-xs font-medium text-purple-700">Avg Response</h3>
              <p className="text-xl font-bold text-purple-800">{typeof avgResponseTime === 'number' ? avgResponseTime.toFixed(2) : '0.00'}s</p>
            </div>
          </div>

          {/* Resources section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Resources</h3>
            
            {/* Website URLs */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Globe className="h-3 w-3" /> Website URLs
              </h4>
              {client.website_urls && client.website_urls.length > 0 ? (
                <ul className="text-sm pl-5 list-disc">
                  {client.website_urls.map((url: any) => (
                    <li key={url.id} className="text-blue-600 hover:underline">
                      <a href={url.url} target="_blank" rel="noopener noreferrer">{url.url}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No website URLs added</p>
              )}
            </div>
            
            {/* Google Drive Links */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Google Drive Links
              </h4>
              {client.google_drive_links && client.google_drive_links.length > 0 ? (
                <ul className="text-sm pl-5 list-disc">
                  {client.google_drive_links.map((link: any) => (
                    <li key={link.id} className="text-blue-600 hover:underline">
                      <a href={link.link} target="_blank" rel="noopener noreferrer">{link.link}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No Google Drive links added</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
