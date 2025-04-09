import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export type ActivityType = 'general' | 'document_upload' | 'document_view' | 'document_delete' | 'note_add' | 'note_edit' | 'note_delete' | 'task_create' | 'task_update' | 'task_complete' | 'task_delete' | 'meeting_scheduled' | 'meeting_completed' | 'meeting_cancelled' | 'email_sent' | 'email_received' | 'call_made' | 'call_received' | 'message_sent' | 'message_received' | 'status_change' | 'profile_update' | 'settings_update' | 'permission_change' | 'login' | 'logout' | 'error' | 'warning' | 'info';

export const createClientActivity = async (
  clientId: string,
  agentName?: string,
  activityType: ActivityType = 'general' as ActivityType,
  description: string = '',
  activityData: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    // Create the activity record
    const { error: activityError } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        activity_type: activityType,
        description,
        activity_data: {
          ...activityData,
          agent_name: agentName
        },
        created_by: user.id
      });

    if (activityError) {
      console.error('Error creating client activity:', activityError);
      return {
        success: false,
        error: activityError.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createClientActivity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export async function logClientActivity(
  clientId: string, 
  activity: string, 
  details?: Record<string, any>
): Promise<void> {
  try {
    await createClientActivity(
      clientId,
      undefined,
      'general',
      activity,
      details || {}
    );
  } catch (error: any) {
    console.error('Error logging client activity:', error);
    throw new Error(error.message || 'Failed to log client activity');
  }
}
