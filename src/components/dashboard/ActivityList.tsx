
import React from "react";
import { ActivityItem } from "./ActivityItem";
import { Loader2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Activity {
  activity_type: string;
  description: string;
  created_at: string;
  metadata: Json;
  client_name?: string;
  client_id?: string;
}

interface ActivityListProps {
  activities?: Activity[];
  isLoading?: boolean;
}

export const ActivityList = ({ activities, isLoading = false }: ActivityListProps) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
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
              key={`${activity.created_at}-${index}`} 
              item={activity} 
            />
          ))
        )}
      </div>
    )}
  </div>
);
