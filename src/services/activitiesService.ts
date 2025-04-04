
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ActivityType } from "@/types/activity";

// Get recent activities across all clients
export const getRecentActivities = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from("client_activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent activities:", error);
      return { success: false, error, data: null };
    }

    const formattedActivities = data.map((activity) => ({
      ...activity,
      timeAgo: formatDistanceToNow(new Date(activity.created_at), {
        addSuffix: true,
      }),
    }));

    return {
      success: true,
      data: formattedActivities,
      error: null,
    };
  } catch (error) {
    console.error("Error in getRecentActivities:", error);
    return {
      success: false,
      error,
      data: null,
    };
  }
};
