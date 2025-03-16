
import React from "react";
import { Calendar, Users, Activity, Mail, Bot, Globe, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClientInfoCardProps {
  client: any;
  chatHistory: any[];
  aiAgentStats?: any;
}

export function ClientInfoCard({ client, chatHistory, aiAgentStats }: ClientInfoCardProps) {
  // Calculate last active time
  const lastActive = client.last_active 
    ? new Date(client.last_active).toLocaleString() 
    : chatHistory.length > 0 
      ? new Date(chatHistory[0].created_at).toLocaleString()
      : "Never";

  // Calculate days since creation
  const createdDate = new Date(client.created_at);
  const today = new Date();
  const daysSinceCreation = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  // Stats from ai_agents if available
  const totalInteractions = aiAgentStats?.total_interactions || chatHistory.length;
  const activeDays = aiAgentStats?.active_days || 0;
  const avgResponseTime = aiAgentStats?.average_response_time || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client Name</h3>
              <p className="font-semibold">{client.client_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="font-semibold flex items-center gap-1">
                <Mail className="h-3 w-3" /> {client.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">AI Agent</h3>
              <p className="font-semibold flex items-center gap-1">
                <Bot className="h-3 w-3" /> {client.agent_name || "Not set"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <Badge variant={client.status === 'active' ? "success" : "destructive"}>
                {client.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {new Date(client.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">{daysSinceCreation} days ago</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
              <p className="font-semibold flex items-center gap-1">
                <Activity className="h-3 w-3" /> {lastActive}
              </p>
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
              <p className="text-xl font-bold text-purple-800">{avgResponseTime.toFixed(2)}s</p>
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
