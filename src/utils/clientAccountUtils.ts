
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/client-form';

export const createClientUserAccount = async (
  email: string,
  clientId: string,
  clientName: string,
  agentName: string,
  agentDescription: string,
  tempPassword: string
) => {
  try {
    console.log(`Creating user account for ${email} with client ID ${clientId}`);
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
    await createClientActivity(
      clientId,
      'account_created' as ActivityType,
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
