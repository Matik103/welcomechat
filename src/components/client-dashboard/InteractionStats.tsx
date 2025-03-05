
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageSquare, Calendar, BarChart3 } from "lucide-react";
import { InteractionStats as InteractionStatsType } from '@/hooks/useClientDashboard';

export interface InteractionStatsProps {
  stats: InteractionStatsType;
}

export const InteractionStats: React.FC<InteractionStatsProps> = ({ stats }) => {
  const { total_interactions, active_days, average_response_time, top_queries } = stats;

  return (
    <>
      <Card className="transition-all hover:shadow-md border-l-4 border-blue-500 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
          <MessageSquare className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-bold text-gray-900">{total_interactions}</div>
          <p className="text-xs text-gray-500 mt-1">Total messages processed</p>
        </CardContent>
      </Card>
      
      <Card className="transition-all hover:shadow-md border-l-4 border-green-500 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Days</CardTitle>
          <Calendar className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-bold text-gray-900">{active_days}</div>
          <p className="text-xs text-gray-500 mt-1">Days with AI interactions</p>
        </CardContent>
      </Card>
      
      <Card className="transition-all hover:shadow-md border-l-4 border-amber-500 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-bold text-gray-900">{average_response_time}s</div>
          <p className="text-xs text-gray-500 mt-1">Average AI response time</p>
        </CardContent>
      </Card>
      
      <Card className="transition-all hover:shadow-md border-l-4 border-purple-500 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Query Types</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-3xl font-bold text-gray-900">{top_queries.length}</div>
          <p className="text-xs text-gray-500 mt-1">Distinct query categories</p>
        </CardContent>
      </Card>
    </>
  );
};
