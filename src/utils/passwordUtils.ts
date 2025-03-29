import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';

export const generateTempPassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

export const saveClientTempPassword = async (agentId: string, email: string, tempPassword: string) => {
  try {
    const { data, error } = await supabase
      .from('client_temp_passwords')
      .upsert(
        { agent_id: agentId, email: email, temp_password: tempPassword },
        { onConflict: 'agent_id, email', ignoreDuplicates: false }
      )
      .select()
    
    if (error) {
      console.error("Error saving temporary password:", error);
      return { success: false, error };
    }
    
    // Log activity for temporary password creation
    await createClientActivity(
      agentId,
      undefined,
      'client_updated',
      `Created temporary password for client with email ${email}`,
      {
        email,
        has_temp_password: true,
        created_at: new Date().toISOString()
      }
    );
    
    return { success: true, password: tempPassword };
  } catch (error) {
    console.error("Error saving temporary password:", error);
    return { success: false, error };
  }
};
