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
 * Creates a new client
 */
export const createClient = async (data: ClientFormData): Promise<string> => {
  // Ensure agent_name is properly formatted
  const sanitizedAgentName = data.agent_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();

  const { data: newClients, error } = await supabase
    .from("clients")
    .insert([{
      client_name: data.client_name,
      email: data.email,
      agent_name: finalAgentName, // Use sanitized agent name
      widget_settings: data.widget_settings || {},
      status: 'active'
    }])
    .select('*');

  if (error) {
    console.error("Error creating client:", error);
    throw error;
  }

  if (!newClients || newClients.length === 0) {
    throw new Error("Failed to create client - no data returned");
  }

  return newClients[0].id;
};

/**
 * Updates an existing client
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  // Ensure agent_name is properly formatted
  const sanitizedAgentName = data.agent_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();

  const { error } = await supabase
    .from("clients")
    .update({
      client_name: data.client_name,
      email: data.email,
      agent_name: finalAgentName, // Use sanitized agent name
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
 * Sends invitation email to a client
 */
export const sendClientInvitation = async (clientId: string, email: string, clientName: string): Promise<boolean> => {
  try {
    console.log("Sending invitation for client:", clientId, email, clientName);
    
    const { data, error } = await supabase.functions.invoke("send-client-invitation", {
      body: {
        clientId,
        email,
        clientName
      }
    });
    
    if (error) {
      console.error("Error sending invitation:", error);
      throw error;
    }
    
    if (data?.error) {
      console.error("Function returned error:", data.error);
      throw new Error(data.error);
    }
    
    console.log("Invitation response:", data);
    return true;
  } catch (error) {
    console.error("Invitation method failed:", error);
    throw error;
  }
};
