import { supabase } from '@/integrations/supabase/client';
import type { ActivityLog } from '@/types/supabase';

export async function logActivity(
  action_type: ActivityLog['action_type'],
  entity_type: ActivityLog['entity_type'],
  entity_id: string,
  description: string,
  metadata: Record<string, any> = {},
  client_id?: string
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('activity_logs').insert({
      action_type,
      entity_type,
      entity_id,
      description,
      metadata,
      user_id: user?.id,
      client_id,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
  }
} 