
import React from "react";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QueryItem } from "@/types/client-dashboard";

interface DashboardContentProps {
  stats: any;
  recentInteractions: any[];
  queries: QueryItem[];
  isLoading: boolean;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  stats,
  recentInteractions,
  queries,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Stats section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <InteractionStats
          stats={stats}
          isLoading={isLoading}
        />
      </div>

      {/* Recent data section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent interactions card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : recentInteractions?.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No recent interactions found</p>
            ) : (
              <div className="space-y-4">
                {recentInteractions.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="border-b pb-3">
                    <p className="font-medium">{interaction.query_text}</p>
                    <p className="text-sm text-gray-500 mt-1">{new Date(interaction.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common queries card */}
        <QueryList
          queries={queries}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};
