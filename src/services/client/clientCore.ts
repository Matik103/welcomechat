
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientFormData } from "@/types/client";

/**
 * Checks and refreshes token if needed
 */
async function ensureValidToken() {
  try {
    // Check the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
      throw error;
    }
    
    if (!session) {
      console.error("No session found");
      throw new Error("Authentication required");
    }
    
    // If session is about to expire (within 5 minutes), refresh it
    const expiresAt = session.expires_at;
    const isExpiringSoon = expiresAt && (expiresAt * 1000 - Date.now() < 300000); // 5 minutes
    
    if (isExpiringSoon) {
      console.log("Token expiring soon, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        throw refreshError;
      }
      
      console.log("Token refreshed successfully");
    }
    
    return session.access_token;
  } catch (err) {
    console.error("Token validation failed:", err);
    throw new Error("Authentication failed, please sign in again");
  }
}

/**
 * Fetches a single client by ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  if (!id) return null;
  
  await ensureValidToken();
  
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
  await ensureValidToken();
  
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
    await ensureValidToken();
    
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
    console.log("Creating client with data:", data);
    
    // Ensure token is valid before proceeding
    await ensureValidToken();

    // Ensure agent_name is properly formatted (sanitized)
    const sanitizedAgentName = data.agent_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    
    const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
    
    console.log("Using sanitized agent name:", finalAgentName);

    // Create the client record
    const { data: newClients, error } = await supabase
      .from("clients")
      .insert([{
        client_name: data.client_name,
        email: data.email,
        agent_name: finalAgentName, // Use the sanitized name
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
    console.log("Created client with ID:", clientId);

    return clientId;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};
