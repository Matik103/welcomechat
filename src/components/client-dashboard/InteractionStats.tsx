
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface InteractionStatsType {
  total_interactions: number;
  active_days: number;
  average_response_time: number;
  top_queries: string[];
}

export interface InteractionStatsProps {
  stats?: InteractionStatsType;
  isLoading?: boolean;
}

const defaultStats: InteractionStatsType = {
  total_interactions: 0,
  active_days: 0,
  average_response_time: 0,
  top_queries: []
};

export const InteractionStats = ({ stats = defaultStats, isLoading = false }: InteractionStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(index => (
          <StatCard
            key={index}
            title="Loading..."
            value={<Loader2 className="h-5 w-5 animate-spin text-primary" />}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Interactions"
        value={stats.total_interactions.toLocaleString()}
        className="border-blue-100 bg-blue-50"
      />
      <StatCard
        title="Active Days"
        value={stats.active_days.toLocaleString()}
        className="border-emerald-100 bg-emerald-50"
      />
      <StatCard
        title="Avg Response Time"
        value={`${stats.average_response_time}s`}
        className="border-amber-100 bg-amber-50"
      />
      <StatCard
        title="Common Topics"
        value={stats.top_queries.length > 0 ? stats.top_queries.length.toString() : "0"}
        className="border-purple-100 bg-purple-50"
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, className = "", isLoading = false }: StatCardProps) => (
  <Card className={`p-6 flex flex-col items-center justify-center text-center ${className} ${isLoading ? 'animate-pulse' : ''}`}>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </Card>
);
