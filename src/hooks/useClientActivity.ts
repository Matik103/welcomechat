
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

      // Cast the activity_type as unknown first to work around the type issues
      const { data, error } = await supabase
        .from("client_activities")
        .insert({
          client_id: clientId,
          activity_type: activity_type as unknown as string,
          description,
          metadata: metadata || {}
        });

      if (error) throw error;
      return data;
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
