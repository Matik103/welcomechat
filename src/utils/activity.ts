import { supabase } from '@/lib/supabase';
import { ExtendedActivityType } from '@/types/activity';
import { Json } from '@/types/supabase-types';

interface LogActivityParams {
  client_id: string;
  activity_type: ExtendedActivityType;
  description: string;
  metadata?: Json;
}

export async function logActivity({
  client_id,
  activity_type,
  description,
  metadata
}: LogActivityParams) {
  try {
    const { error } = await supabase
      .from('client_activities')
      .insert({
        client_id,
        activity_type,
        description,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to log activity:', err);
    throw err;
  }
} 