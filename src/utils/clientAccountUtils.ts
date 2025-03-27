
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Function to set up a new client account
export async function setupNewClientAccount(clientData: any) {
  try {
    // Generate a unique client ID
    const clientId = uuidv4();

    // Create a new client record in the ai_agents table (which now replaces the clients table)
    const { error: clientError } = await supabase
      .from('ai_agents')
      .insert({
        id: clientId,
        client_id: clientId,
        client_name: clientData.name,
        name: clientData.agent_name || 'AI Assistant',
        email: clientData.email,
        agent_description: clientData.agent_description || 'Your AI Assistant',
        interaction_type: "config",
        status: "active",
        settings: {
          agent_name: clientData.agent_name || 'AI Assistant',
          agent_description: clientData.agent_description || 'Your AI Assistant',
          primary_color: clientData.primary_color,
          secondary_color: clientData.secondary_color,
          logo_url: clientData.logo_url,
          custom_domain: clientData.custom_domain,
          email: clientData.email,
          client_name: clientData.name
        },
        logo_url: clientData.logo_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (clientError) {
      console.error("Error creating client:", clientError);
      return { success: false, error: clientError };
    }

    // Log instead of saving to database
    console.log("[ACTIVITY LOG] Created new client account:", {
      clientId,
      clientName: clientData.name,
      timestamp: new Date().toISOString()
    });

    return { success: true, clientId };
  } catch (error) {
    console.error("Error setting up client account:", error);
    return { success: false, error };
  }
}

// Function to delete a client account
export async function deleteClientAccount(clientId: string) {
  try {
    // Now we update the ai_agents record instead of deleting from clients table
    const { error: clientError } = await supabase
      .from('ai_agents')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    if (clientError) {
      console.error("Error deleting client:", clientError);
      return { success: false, error: clientError };
    }

    // Log the deletion in console
    console.log("[ACTIVITY LOG] Client account deleted:", {
      clientId,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting client account:", error);
    return { success: false, error };
  }
}
