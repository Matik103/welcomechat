import { supabase } from "@/integrations/supabase/client";
import { callRpcFunction } from "@/utils/rpcUtils";

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
 * Create a new client account with the given details
 */
export const createClientAccount = async (
  clientName: string,
  email: string,
  password?: string,
  additionalData?: Record<string, any>
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const tempPassword = password || generateTempPassword();
    
    // Step 1: Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          client_name: clientName,
          is_client: true,
          ...additionalData
        }
      }
    });
    
    if (authError) {
      console.error("Error creating client auth account:", authError);
      return {
        success: false,
        message: `Failed to create client account: ${authError.message}`
      };
    }
    
    if (!authData?.user) {
      return {
        success: false,
        message: "Failed to create client account: No user returned"
      };
    }
    
    const userId = authData.user.id;
    
    // Step 2: Create the client record in ai_agents
    const clientId = crypto.randomUUID();
    
    const { data: clientData, error: clientError } = await supabase
      .from("ai_agents")
      .insert({
        id: clientId,
        client_id: clientId,
        user_id: userId,
        name: "AI Assistant",
        interaction_type: "config",
        status: "active",
        settings: {
          client_name: clientName,
          email: email,
          created_at: new Date().toISOString(),
          temp_password: tempPassword,
          temp_password_set_at: new Date().toISOString(),
          ...additionalData
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (clientError) {
      console.error("Error creating client record:", clientError);
      
      // If client record creation fails, we should delete the auth user to keep things consistent
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        console.error("Failed to clean up auth user after client creation failure:", deleteError);
      }
      
      return {
        success: false,
        message: `Failed to create client record: ${clientError.message}`
      };
    }
    
    // Step 3: Log the client creation activity
    try {
      await callRpcFunction('log_client_activity', {
        client_id_param: clientId,
        activity_type_param: 'client_created',
        description_param: `New client created: ${clientName}`,
        metadata_param: {
          email,
          created_at: new Date().toISOString()
        }
      });
    } catch (activityError) {
      console.error("Error logging client creation activity:", activityError);
      // Don't fail the whole operation just because activity logging failed
    }
    
    return {
      success: true,
      message: "Client account created successfully",
      data: {
        client_id: clientId,
        user_id: userId,
        email,
        client_name: clientName,
        temp_password: tempPassword
      }
    };
  } catch (error) {
    console.error("Error in createClientAccount:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
    };
  }
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

/**
 * Generates a welcome email template for a new client
 */
export const generateClientWelcomeEmailTemplate = (
  clientName: string, 
  loginUrl: string,
  email: string,
  tempPassword: string
): string => {
  return `
    <h2>Welcome to Our Platform, ${clientName}!</h2>
    <p>Your account has been created successfully.</p>
    <p><strong>Login Details:</strong></p>
    <ul>
      <li>Email: ${email}</li>
      <li>Temporary Password: ${tempPassword}</li>
    </ul>
    <p>Please login at <a href="${loginUrl}">${loginUrl}</a> to get started.</p>
    <p>You will be prompted to change your password on first login.</p>
    <p>If you have any questions, please contact our support team.</p>
  `;
};
