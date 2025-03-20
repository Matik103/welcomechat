
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ChatInteraction } from "@/types/extended-supabase";

interface ChatHistoryCardProps {
  chatHistory?: ChatInteraction[];
  isLoading?: boolean;
}

export const ChatHistoryCard = ({ chatHistory = [], isLoading = false }: ChatHistoryCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Chat Interactions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chatHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Chat Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-10">
            No chat interactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Chat Interactions</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          {chatHistory.map((interaction) => (
            <div key={interaction.id} className="border-b pb-4 px-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-primary">{format(new Date(interaction.timestamp), "MMM d, yyyy HH:mm")}</span>
                {interaction.agentName && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{interaction.agentName}</span>
                )}
              </div>
              <div className="space-y-2">
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <p className="font-medium text-gray-600 mb-1">Query:</p>
                  <p>{interaction.query}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg text-sm">
                  <p className="font-medium text-gray-600 mb-1">Response:</p>
                  <p>{interaction.response}</p>
                </div>
                {interaction.responseTimeMs && (
                  <p className="text-xs text-gray-500 text-right">
                    Response time: {(interaction.responseTimeMs / 1000).toFixed(2)}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
