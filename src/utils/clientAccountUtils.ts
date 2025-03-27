import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';

export const createClientUserAccount = async (
  email: string,
  clientId: string,
  clientName: string,
  agentName: string,
  agentDescription: string,
  tempPassword: string
) => {
  try {
    // Implementation details would be here
    console.log(`Creating user account for ${email} with client ID ${clientId}`);
    
    // This is where you would create the actual user account
    // For now, we just return success
    return { success: true };
  } catch (error) {
    console.error("Error creating client user account:", error);
    throw error;
  }
};

export const logClientCreationActivity = async (
  clientId: string, 
  clientName: string,
  email: string,
  agentName: string
) => {
  try {
    // Use ai_agent_created instead of agent_created
    await createClientActivity(
      clientId,
      'ai_agent_created', // Changed from 'agent_created' to 'ai_agent_created'
      `Client created: ${clientName}`,
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
