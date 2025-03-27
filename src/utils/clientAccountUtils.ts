
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/client-form';
import { toast } from 'sonner';

/**
 * Creates a client user account by calling the create-client-user Edge Function
 * 
 * @param email Email address for the new user
 * @param clientId Client ID associated with the user
 * @param clientName Client name for the welcome email
 * @param agentName Agent name for the welcome email
 * @param agentDescription Agent description
 * @param tempPassword Temporary password for the user
 * @returns Object with success status and user data
 */
export const createClientUserAccount = async (
  email: string,
  clientId: string,
  clientName: string,
  agentName: string,
  agentDescription: string,
  tempPassword: string
) => {
  try {
    // Call the Edge Function to create the user account
    const { data, error } = await supabase.functions.invoke('create-client-user', {
      body: {
        email,
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName,
        agent_description: agentDescription,
        temp_password: tempPassword
      }
    });
    
    if (error) {
      console.error("Error from create-client-user function:", error);
      throw error;
    }
    
    if (!data?.success) {
      console.error("Failed to create client user account:", data?.message || "Unknown error");
      throw new Error(data?.message || "Failed to create client user account");
    }
    
    console.log("Client user account created successfully:", data);
    
    return { 
      success: true, 
      userId: data.userId, 
      clientId: data.clientId,
      password: data.password
    };
  } catch (error) {
    console.error("Error creating client user account:", error);
    throw error;
  }
};

/**
 * Logs a client creation activity in the system
 * 
 * @param clientId Client ID
 * @param clientName Client name
 * @param email Client email
 * @param agentName Agent name
 * @returns Object with success status
 */
export const logClientCreationActivity = async (
  clientId: string, 
  clientName: string,
  email: string,
  agentName: string
) => {
  try {
    await createClientActivity(
      clientId,
      'account_created' as ActivityType,
      `Account created: ${clientName}`,
      {
        client_id: clientId,
        email,
        agent_name: agentName
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error("Error logging client creation activity:", error);
    throw error;
  }
};

/**
 * Sends a welcome email to a new client user
 * 
 * @param clientId Client ID
 * @param clientName Client name
 * @param email Client email
 * @param agentName Agent name
 * @param tempPassword Temporary password
 * @returns Object with email sending status
 */
export const sendClientWelcomeEmail = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string,
  tempPassword: string
) => {
  try {
    // Call the Edge Function to send the welcome email
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        clientId,
        clientName,
        email,
        agentName,
        tempPassword
      }
    });
    
    if (error) {
      console.error("Error from send-welcome-email function:", error);
      throw error;
    }
    
    if (!data?.success) {
      console.error("Failed to send welcome email:", data?.error || "Unknown error");
      return { 
        emailSent: false, 
        emailError: data?.error || "Failed to send welcome email" 
      };
    }
    
    console.log("Welcome email sent successfully:", data);
    
    return { 
      emailSent: true,
      emailData: data
    };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { 
      emailSent: false, 
      emailError: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};
