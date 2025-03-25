
import React from "react";
import { ActivityItem } from "./ActivityItem";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface Activity {
  id?: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: any;
  client_name?: string;
  client_id?: string;
  client_email?: string;
  agent_name?: string;
}

interface ActivityListProps {
  activities?: Activity[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const ActivityList = ({ activities, isLoading = false, onRefresh }: ActivityListProps) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      {onRefresh && (
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex items-center gap-1">
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      )}
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ) : (
      <div className="divide-y divide-gray-100">
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-3">No recent activities found</p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh Activities
              </Button>
            )}
          </div>
        ) : (
          activities.map((activity, index) => (
            <ActivityItem 
              key={activity.id || `${activity.created_at}-${index}`} 
              item={activity} 
            />
          ))
        )}
      </div>
    )}
  </div>
);
