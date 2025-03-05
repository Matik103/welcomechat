
import React from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UseQueryResult } from "@tanstack/react-query";

interface InteractionStatsProps {
  interactionStats: {
    total: number;
    successRate: number;
    averagePerDay: number;
  } | null;
  isLoading: boolean;
}

export const InteractionStats: React.FC<InteractionStatsProps> = ({ 
  interactionStats, 
  isLoading 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCard
        title="Total Interactions (30 days)"
        value={interactionStats?.total || 0}
        isLoading={isLoading}
      />
      <MetricCard
        title="Success Rate"
        value={`${interactionStats?.successRate || 0}%`}
        isLoading={isLoading}
      />
      <MetricCard
        title="Daily Average"
        value={interactionStats?.averagePerDay || 0}
        isLoading={isLoading}
      />
    </div>
  );
};
