
// Ensure this file exports the InteractionStats component properly
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StatCardProps {
  title: string;
  value: any;
  isLoading: boolean;
}

export function StatCard({ title, value, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractionStats({ totalQueries, activeUsers, responseRate, averageTime, isLoading }: {
  totalQueries?: number;
  activeUsers?: number;
  responseRate?: string;
  averageTime?: string;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Queries"
        value={totalQueries || 0}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Users"
        value={activeUsers || 0}
        isLoading={isLoading}
      />
      <StatCard
        title="Response Rate"
        value={responseRate || "0%"}
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Response Time"
        value={averageTime || "0s"}
        isLoading={isLoading}
      />
    </div>
  );
}

// For backwards compatibility, also export as default
export default InteractionStats;
