import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';

/**
 * Creates a new user account in Supabase Auth.
 */
export const createClientUserAccount = async (
  email: string,
  clientId: string,
  clientName: string,
  agentName: string,
  agentDescription: string,
  tempPassword?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword || generateRandomPassword(),
      user_metadata: {
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName,
        agent_description: agentDescription
      },
    });

    if (error) {
      console.error("Error creating user:", error);
      return { success: false, error: error.message };
    }
    
    // Create a user role entry
    const roleResult = await createUserRole(data.user.id, 'client', clientId);
    if (!roleResult) {
      console.error("Error creating user role");
      return { success: false, error: "Failed to create user role" };
    }

    console.log("User created successfully:", data);
    return { success: true };
  } catch (error: any) {
    console.error("Error in createClientUserAccount:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};

/**
 * Logs client creation activity to the audit log.
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('audit_log')
      .insert({
        event_type: 'client_created',
        client_id: clientId,
        client_name: clientName,
        email: email,
        agent_name: agentName,
        timestamp: new Date().toISOString(),
        description: `Client ${clientName} with email ${email} was created.`,
        user_id: supabase.auth.currentUser?.id || 'system'
      });

    if (error) {
      console.error("Error logging client creation activity:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in logClientCreationActivity:", error);
    // Consider whether to rethrow or handle the error silently
  }
};

/**
 * Sends a welcome email to the new client.
 */
export const sendClientWelcomeEmail = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string,
  tempPassword?: string
): Promise<{ emailSent: boolean; emailError?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        client_id: clientId,
        client_name: clientName,
        email: email,
        agent_name: agentName,
        temp_password: tempPassword
      },
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return { emailSent: false, emailError: error.message };
    }

    if (data?.success === false) {
      console.error("Function execution failed:", data?.error);
      return { emailSent: false, emailError: data.error || 'Function execution failed' };
    }

    console.log("Welcome email sent successfully:", data);
    return { emailSent: true };
  } catch (error: any) {
    console.error("Error in sendClientWelcomeEmail:", error);
    return { emailSent: false, emailError: error.message || "Unknown error" };
  }
};

/**
 * Generates a random password for new users.
 * @returns {string} The generated password.
 */
const generateRandomPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

/**
 * Creates a user role entry in the user_roles table.
 */
export const createUserRole = async (userId: string, role: string, clientId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        client_id: clientId || null,
      });

    if (error) {
      console.error("Error creating user role:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createUserRole:", error);
    return false;
  }
};
