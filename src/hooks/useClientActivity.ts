
import { useMutation } from '@tanstack/react-query';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useClientActivity = (clientId: string | undefined) => {
  const logActivity = useMutation({
    mutationFn: async (params: {
      activity_type: ActivityType; 
      description: string;
      metadata?: Record<string, any>;
    }) => {
      if (!clientId) {
        console.error("Cannot log activity: No client ID available");
        return null;
      }
      
      const { data, error } = await supabase
        .from('client_activities')
        .insert({
          client_id: clientId,
          activity_type: params.activity_type,
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
    activity_type: ActivityType,
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
