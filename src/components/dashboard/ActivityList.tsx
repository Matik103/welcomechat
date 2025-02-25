
import React from "react";
import { format } from "date-fns";
import { ActivityItem } from "./ActivityItem";
import type { Json } from "@/integrations/supabase/types";

interface Activity {
  activity_type: string;
  description: string;
  created_at: string;
  metadata: Json;
  client_name?: string;
}

interface ActivityListProps {
  activities?: Activity[];
}

export const ActivityList = ({ activities }: ActivityListProps) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
    <div className="divide-y divide-gray-100">
      {activities?.length === 0 ? (
        <p className="text-gray-500 py-4">No recent activities</p>
      ) : (
        activities?.map((activity, index) => (
          <ActivityItem key={`${activity.created_at}-${index}`} item={activity} />
        ))
      )}
    </div>
  </div>
);
