
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientFormData } from "@/types/client";
import { toast } from "sonner";

/**
 * Fetches a single client by ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  if (!id) return null;
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Client;
};

/**
 * Updates an existing client
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  const { error } = await supabase
    .from("clients")
    .update({
      client_name: data.client_name,
      email: data.email,
      agent_name: data.agent_name,
      widget_settings: data.widget_settings,
    })
    .eq("id", id);
  if (error) throw error;
  return id;
};

/**
 * Logs client update activity
 */
export const logClientUpdateActivity = async (id: string): Promise<void> => {
  try {
    const user = await supabase.auth.getUser();
    const isClientUser = user.data.user?.user_metadata?.client_id === id;
    if (isClientUser) {
      await supabase.from("client_activities").insert({
        client_id: id,
        activity_type: "client_updated",
        description: "updated their account information",
        metadata: {}
      });
    }
  } catch (activityError) {
    console.error("Error logging activity:", activityError);
  }
};

/**
 * Creates a new client
 */
export const createClient = async (data: ClientFormData): Promise<string> => {
  try {
    // Create the client record
    const { data: newClients, error } = await supabase
      .from("clients")
      .insert([{
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        widget_settings: data.widget_settings || {},
        status: 'active',
        website_url_refresh_rate: 60,
        drive_link_refresh_rate: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*');

    if (error) {
      console.error("Error creating client:", error);
      throw error;
    }

    if (!newClients || newClients.length === 0) {
      throw new Error("Failed to create client - no data returned");
    }

    const clientId = newClients[0].id;

    // Add entry to ai_agents table
    try {
      const { error: aiAgentError } = await supabase
        .from("ai_agents")
        .insert([{
          client_id: clientId,
          name: data.agent_name,
          settings: {
            client_name: data.client_name,
            created_at: new Date().toISOString()
          }
        }]);

      if (aiAgentError) {
        console.error("Error creating AI agent entry:", aiAgentError);
        // Continue despite error, as client was created successfully
      }
    } catch (aiAgentError) {
      console.error("Failed to create AI agent entry:", aiAgentError);
      // Continue despite error, as client was created successfully
    }

    return clientId;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

/**
 * Sends invitation email to a client
 */
export const sendClientInvitation = async (clientId: string, email: string, clientName: string): Promise<boolean> => {
  try {
    console.log("Sending invitation for client:", clientId, email, clientName);
    
    // Get the auth token to include in the request
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      throw new Error("No access token available. Please log in to send invitations.");
    }
    
    // Determine the invitation URL (add client setup route)
    const baseUrl = window.location.origin;
    const setupUrl = `${baseUrl}/client-setup?id=${clientId}`;
    
    const { data, error } = await supabase.functions.invoke("send-invitation", {
      body: {
        email,
        role_type: "client",
        url: setupUrl,
        clientName,
        clientId
      },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    if (error) {
      console.error("Error sending invitation (function invoke error):", error);
      throw new Error(`Failed to call invitation function: ${error.message}`);
    }
    
    if (data?.error) {
      console.error("Function returned error:", data.error);
      throw new Error(`Invitation function error: ${data.error}`);
    }
    
    console.log("Invitation response:", data);
    return true;
  } catch (error) {
    console.error("Invitation method failed:", error);
    throw error;
  }
};

/**
 * Creates a client user account with temporary password
 */
export const createClientUserAccount = async (clientId: string, email: string, clientName: string, aiAgentName: string): Promise<boolean> => {
  try {
    console.log("Creating client user account:", { clientId, email, clientName, aiAgentName });
    
    const { data, error } = await supabase.functions.invoke("create-client-user", {
      body: {
        clientId,
        email,
        clientName,
        aiAgentName
      }
    });
    
    if (error) {
      console.error("Error creating client user account:", error);
      throw new Error(`Failed to create client user: ${error.message}`);
    }
    
    if (data?.error) {
      console.error("Function returned error:", data.error);
      throw new Error(`Client user creation error: ${data.error}`);
    }
    
    console.log("Client user creation response:", data);
    return true;
  } catch (error) {
    console.error("Client user creation failed:", error);
    throw error;
  }
};
