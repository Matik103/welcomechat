
import { supabase } from '@/integrations/supabase/client';
import { ErrorLog } from '@/types/client-dashboard';

/**
 * Fetch error logs for a client
 */
export const fetchErrorLogs = async (clientId?: string, limit: number = 10): Promise<ErrorLog[]> => {
  try {
    let query = supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching error logs:', error);
      return [];
    }
    
    return data as ErrorLog[];
  } catch (error) {
    console.error('Error in fetchErrorLogs:', error);
    return [];
  }
};

/**
 * Create a new error log
 */
export const createErrorLog = async (
  error_type: string,
  message: string,
  clientId?: string
): Promise<ErrorLog | null> => {
  try {
    const { data, error } = await supabase
      .from('error_logs')
      .insert({
        client_id: clientId,
        error_type,
        message,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating error log:', error);
      return null;
    }
    
    return data as ErrorLog;
  } catch (error) {
    console.error('Error in createErrorLog:', error);
    return null;
  }
};

/**
 * Update error log status
 */
export const updateErrorLogStatus = async (
  errorLogId: string,
  status: 'pending' | 'resolved' | 'in_progress'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('error_logs')
      .update({ status })
      .eq('id', errorLogId);
    
    if (error) {
      console.error('Error updating error log status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateErrorLogStatus:', error);
    return false;
  }
};
