
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a temporary password for a new client
 */
export const generateClientTempPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

/**
 * Saves the temporary password for a client
 */
export const saveClientTempPassword = async (
  agentId: string,
  email: string,
  tempPassword: string
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('ai_agents')
      .update({
        settings: {
          tempPassword: tempPassword,
          tempPasswordSetAt: new Date().toISOString()
        }
      })
      .eq('id', agentId)
      .eq('email', email);

    if (error) {
      console.error("Error saving temporary password:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw error;
  }
};
