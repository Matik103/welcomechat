import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction } from "./rpcUtils";

/**
 * Generates a temporary password for a new client
 */
export const generateTempPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

/**
 * Saves the temporary password to the ai_agents table
 */
export const saveClientTempPassword = async (
  agentId: string,
  email: string,
  tempPassword?: string
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

/**
 * Log client creation activity
 */
export const logClientCreation = async (
  clientId: string, 
  clientName: string, 
  email: string
) => {
  try {
    // Use callRpcFunction for activity logging to avoid type checking issues
    await callRpcFunction('log_client_activity', {
      client_id_param: clientId,
      activity_type_param: 'client_created',
      description_param: `New client created: ${clientName}`,
      metadata_param: {
        email,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error logging client creation:", error);
  }
};
