
import React from "react";
import { ActivityItem } from "./ActivityItem";
import { Loader2, RefreshCw } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

interface Activity {
  id?: string;
  activity_type: string;
  description: string;
  created_at: string;
  metadata: Json;
  client_name?: string;
  client_id?: string;
  client_email?: string;
  agent_name?: string;
  agent_description?: string;
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
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 px-2">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
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
          <p className="text-gray-500 py-4">No recent activities</p>
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
