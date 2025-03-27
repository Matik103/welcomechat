
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';

// Function to set up a new client account
export async function setupNewClientAccount(clientData: any) {
  try {
    // Generate a unique client ID
    const clientId = uuidv4();

    // Create a new client record in the clients table
    const { error: clientError } = await supabase
      .from('clients')
      .insert({
        id: clientId,
        client_name: clientData.name,
        email: clientData.email,
        widget_settings: {
          primary_color: clientData.primary_color,
          secondary_color: clientData.secondary_color,
          logo_url: clientData.logo_url,
          custom_domain: clientData.custom_domain
        },
        status: 'active'
      });

    if (clientError) {
      console.error("Error creating client:", clientError);
      return { success: false, error: clientError };
    }

    // Create a default AI agent for the client
    const { error: agentError } = await supabase
      .from('ai_agents')
      .insert([
        {
          client_id: clientId,
          name: clientData.agent_name || 'AI Assistant',
          description: clientData.agent_description || 'Your AI Assistant',
          interaction_type: 'config',
          settings: {
            greeting: clientData.agent_greeting || 'Hello! How can I help you today?',
            primary_color: clientData.primary_color,
            secondary_color: clientData.secondary_color,
            logo_url: clientData.logo_url,
            agent_description: clientData.agent_description || 'Your AI Assistant'
          },
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (agentError) {
      console.error("Error creating AI agent:", agentError);
      return { success: false, error: agentError };
    }

    // Log client creation - using the fixed parameters
    await createClientActivity(
      clientId,
      "Created new client account",
      { clientName: clientData.name }
    );

    return { success: true, clientId };
  } catch (error) {
    console.error("Error setting up client account:", error);
    return { success: false, error };
  }
}

// Function to delete a client account
export async function deleteClientAccount(clientId: string) {
  try {
    // Delete the client record from the clients table
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (clientError) {
      console.error("Error deleting client:", clientError);
      return { success: false, error: clientError };
    }

    // Optionally, log the deletion activity
    console.log(`Client account deleted successfully for client ID: ${clientId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting client account:", error);
    return { success: false, error };
  }
}
