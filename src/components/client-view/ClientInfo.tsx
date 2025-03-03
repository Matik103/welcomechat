
import React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatInteraction } from "@/types/agent";

interface ClientInfoProps {
  client: {
    client_name: string;
    agent_name: string;
    email: string;
    status: string;
  };
  chatHistory: ChatInteraction[] | undefined;
}

export const ClientInfo: React.FC<ClientInfoProps> = ({ client, chatHistory }) => {
  const getLastInteractionTime = () => {
    if (!chatHistory?.length) return 'No interactions yet';
    const lastChat = chatHistory[0];
    return format(new Date(lastChat.metadata.timestamp), 'PPP');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Agent Configuration</CardTitle>
        <CardDescription>Settings and basic information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">AI Agent Name</p>
          <p className="font-medium">{client.agent_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Client Email</p>
          <p className="font-medium">{client.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">AI Agent Status</p>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              client.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {client.status || "active"}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Chat Interaction</p>
          <p className="font-medium">{getLastInteractionTime()}</p>
        </div>
      </CardContent>
    </Card>
  );
};
