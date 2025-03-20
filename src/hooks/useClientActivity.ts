
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExtendedActivityType } from "@/types/extended-supabase";
import { Json } from "@/integrations/supabase/types";

export const useClientActivity = (clientId?: string) => {
  const logActivity = useMutation({
    mutationFn: async ({
      activity_type,
      description,
      metadata
    }: {
      activity_type: ExtendedActivityType;
      description: string;
      metadata?: Json;
    }) => {
      if (!clientId) throw new Error("Client ID is required to log activities");

      try {
        // Using RPC function to handle activity logging to avoid type mismatches with supabase client
        const { data, error } = await supabase.rpc('log_client_activity', {
          p_client_id: clientId,
          p_activity_type: activity_type,
          p_description: description,
          p_metadata: metadata || {}
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error logging activity:", error);
        throw error;
      }
    }
  });

  return {
    logActivity,
    logClientActivity: async (
      activity_type: ExtendedActivityType,
      description: string,
      metadata?: Json
    ) => {
      return logActivity.mutateAsync({ activity_type, description, metadata });
    }
  };
};
