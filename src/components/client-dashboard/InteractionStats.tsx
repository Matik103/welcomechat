
import React from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";

interface InteractionStatsProps {
  stats: {
    total: number;
    successRate: number;
    averagePerDay: number;
  };
  isLoading: boolean;
}

export const InteractionStats: React.FC<InteractionStatsProps> = ({ 
  stats, 
  isLoading 
}) => {
  return (
    <>
      <MetricCard
        title="Total Interactions (30 days)"
        value={stats.total || 0}
        isLoading={isLoading}
      />
      <MetricCard
        title="Success Rate"
        value={`${stats.successRate || 0}%`}
        isLoading={isLoading}
      />
      <MetricCard
        title="Daily Average"
        value={stats.averagePerDay || 0}
        isLoading={isLoading}
      />
    </>
  );
};
