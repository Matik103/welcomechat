
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Calendar, User, Info } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface ActivityItemProps {
  item: {
    activity_type: string;
    description: string;
    created_at: string;
    metadata: Json;
    client_name?: string;
    client_email?: string;
    agent_name?: string;
    agent_description?: string;
  };
}

export const ActivityItem = ({ item }: ActivityItemProps) => {
  // Format the created_at date
  const formattedDate = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error, item.created_at);
      return "Date unknown";
    }
  }, [item.created_at]);

  // Get an icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "chat_interaction":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "client_created":
      case "client_updated":
      case "client_deleted":
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get the activity type as a readable string
  const getActivityTypeDisplay = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="py-4 flex items-start gap-3">
      <div className="mt-1">{getActivityIcon(item.activity_type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 break-words">
          {item.description || "Activity recorded"}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-0.5 rounded">
            {getActivityTypeDisplay(item.activity_type)}
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">{item.client_name || "Unknown Client"}</span>
          {item.agent_name && (
            <>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">{item.agent_name}</span>
            </>
          )}
          <span className="hidden md:inline">•</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
