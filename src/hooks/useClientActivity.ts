
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;

  const logClientActivity = useCallback(
    async (activity_type: ExtendedActivityType, description: string, metadata: Json = {}) => {
      if (!clientId) {
        console.error("Cannot log activity: No client ID found");
        return;
      }

      try {
        const { error } = await supabase.from("client_activities").insert({
          client_id: clientId,
          activity_type,
          description,
          metadata
        });

        if (error) {
          console.error("Error logging client activity:", error);
        }
      } catch (err) {
        console.error("Failed to log client activity:", err);
      }
    },
    [clientId]
  );

  return { logClientActivity };
};
