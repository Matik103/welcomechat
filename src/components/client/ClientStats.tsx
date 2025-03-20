
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { Loader2 } from "lucide-react";
import { InteractionStats } from "@/types/client-dashboard";

interface ClientStatsProps {
  clientId: string;
  agentName?: string;
}

export const ClientStats = ({ clientId, agentName }: ClientStatsProps) => {
  const { stats, isLoading, error } = useClientDashboard(clientId, agentName);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-10">
            Unable to load statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have consistent property names by accessing either camelCase or snake_case
  const totalInteractions = stats.totalInteractions ?? stats.total_interactions;
  const activeDays = stats.activeDays ?? stats.active_days;
  const averageResponseTime = stats.averageResponseTime ?? stats.average_response_time;
  const topQueries = stats.topQueries ?? stats.top_queries;
  const successRate = stats.successRate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-500 font-medium">Total Interactions</p>
            <p className="text-2xl font-bold">{totalInteractions}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-500 font-medium">Active Days</p>
            <p className="text-2xl font-bold">{activeDays}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-500 font-medium">Avg Response Time</p>
            <p className="text-2xl font-bold">{typeof averageResponseTime === 'number' ? averageResponseTime.toFixed(2) : 'N/A'}s</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-500 font-medium">Success Rate</p>
            <p className="text-2xl font-bold">
              {successRate !== undefined ? `${successRate}%` : 'N/A'}
            </p>
          </div>
        </div>

        {topQueries && topQueries.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-3">Top Queries</h3>
            <ul className="space-y-2">
              {topQueries.map((query, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded text-sm">
                  <div className="flex justify-between">
                    <span className="line-clamp-1 flex-1">{query.query_text}</span>
                    <span className="text-gray-400 ml-2 whitespace-nowrap">{query.frequency}×</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
