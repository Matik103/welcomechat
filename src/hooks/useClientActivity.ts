
import { useMutation } from '@tanstack/react-query';
import { ActivityType, ActivityTypeString } from '@/types/activity';
import { supabase } from '@/integrations/supabase/client';
import { getSafeActivityType } from '@/utils/activityTypeUtils';

export const useClientActivity = (clientId: string | undefined) => {
  const logActivity = useMutation({
    mutationFn: async (params: {
      activity_type: ActivityType | ActivityTypeString; 
      description: string;
      metadata?: Record<string, any>;
    }) => {
      if (!clientId) {
        console.error("Cannot log activity: No client ID available");
        return null;
      }
      
      // Get safe activity type string for database
      const safeActivityType = getSafeActivityType(
        typeof params.activity_type === 'string' 
          ? params.activity_type 
          : String(params.activity_type)
      );
      
      const { data, error } = await supabase
        .from('client_activities')
        .insert({
          client_id: clientId,
          activity_type: safeActivityType,
          description: params.description,
          activity_data: params.metadata || {}
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error logging client activity:", error);
        throw error;
      }
      
      return data;
    }
  });

  const logClientActivity = async (
    activity_type: ActivityType | ActivityTypeString,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    try {
      if (!clientId) {
        console.warn("Cannot log activity: No client ID provided");
        return;
      }
      
      await logActivity.mutateAsync({
        activity_type,
        description,
        metadata
      });
      
      console.log(`Activity logged: ${activity_type} - ${description}`);
    } catch (error) {
      console.error("Failed to log client activity:", error);
      // Don't show toast for logging errors - this is a background operation
    }
  };

  return {
    logClientActivity,
    isLoggingActivity: logActivity.isPending,
    loggingError: logActivity.error
  };
};
