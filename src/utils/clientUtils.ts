
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a recovery token for a client scheduled for deletion
 * @param clientId The ID of the client
 * @returns The generated token
 */
export const generateRecoveryToken = async (clientId: string): Promise<string> => {
  try {
    // Generate a unique token
    const token = uuidv4();
    
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Store the token in the client_recovery_tokens table
    const { error } = await supabaseAdmin
      .from('client_recovery_tokens')
      .insert({
        client_id: clientId,
        token: token,
        expires_at: expiresAt.toISOString()
      });
      
    if (error) {
      console.error("Error creating recovery token:", error);
      throw error;
    }
    
    return token;
  } catch (error) {
    console.error("Error in generateRecoveryToken:", error);
    throw error;
  }
};

/**
 * Recovers a client account using a recovery token
 * @param token The recovery token
 * @returns Success status and client ID if successful
 */
export const recoverClientAccount = async (token: string): Promise<{ success: boolean; clientId?: string }> => {
  try {
    // Find the token in the database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('client_recovery_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .single();
      
    if (tokenError || !tokenData) {
      console.error("Invalid or expired recovery token:", tokenError);
      return { success: false };
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.error("Recovery token has expired");
      return { success: false };
    }
    
    // Update the client's status back to active
    const { error: updateError } = await supabaseAdmin
      .from('ai_agents')
      .update({ 
        deletion_scheduled_at: null,
        status: 'active'
      })
      .eq('id', tokenData.client_id);
      
    if (updateError) {
      console.error("Error recovering client account:", updateError);
      return { success: false };
    }
    
    // Mark token as used
    const { error: tokenUpdateError } = await supabaseAdmin
      .from('client_recovery_tokens')
      .update({ 
        used_at: new Date().toISOString() 
      })
      .eq('id', tokenData.id);
      
    if (tokenUpdateError) {
      console.warn("Warning: Failed to mark recovery token as used:", tokenUpdateError);
    }
    
    // Record recovery activity using the ai_agents table as an activity log
    // to avoid issues with enum types
    const { error: activityError } = await supabaseAdmin
      .from('ai_agents')
      .insert({
        client_id: tokenData.client_id,
        interaction_type: 'activity_log',
        name: 'Activity Logger',
        type: 'client_recovered',
        content: 'Client account recovered using recovery token',
        metadata: {
          recovered_at: new Date().toISOString(),
          recovery_method: 'token',
          activity_subtype: 'account_recovered'
        },
        created_at: new Date().toISOString()
      });
      
    if (activityError) {
      console.warn("Warning: Failed to record recovery activity:", activityError);
    }
    
    return { 
      success: true, 
      clientId: tokenData.client_id 
    };
    
  } catch (error) {
    console.error("Error in recoverClientAccount:", error);
    return { success: false };
  }
};
