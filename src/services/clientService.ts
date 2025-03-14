import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
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
    console.log("Creating new client with Edge Function...");
    
    // Check if email already exists in clients table
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("id, email")
      .eq("email", data.email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing client:", checkError);
      throw checkError;
    }

    if (existingClient) {
      throw new Error("A client with this email already exists");
    }
    
    // Call the create-client-user Edge Function with admin client
    const { data: response, error: functionError } = await supabaseAdmin.functions.invoke("create-client-user", {
      body: {
        email: data.email,
        clientName: data.client_name,
        aiAgentName: data.agent_name
      }
    });

    if (functionError) {
      console.error("Edge function error:", functionError);
      throw functionError;
    }

    if (response?.error) {
      console.error("Function returned error:", response.error);
      throw new Error(response.error);
    }

    return response.clientId || 'success';
  } catch (error) {
    console.error("Error in createClient:", error);
    if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
      throw new Error("A client with this email already exists");
    }
    throw error;
  }
};

/**
 * Sends invitation email to a client
 */
export const sendClientInvitation = async (clientId: string, email: string, clientName: string): Promise<boolean> => {
  try {
    console.log("Starting client invitation process...");
    console.log("Parameters:", { clientId, email, clientName });
    
    // Use admin client for Edge Function call
    const { data, error } = await supabaseAdmin.functions.invoke("send-client-invitation", {
      body: {
        clientId,
        email,
        clientName
      }
    });
    
    console.log("Edge function response:", { data, error });
    
    if (error) {
      console.error("Edge function error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        status: error.status,
        stack: error.stack,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    if (data?.error) {
      console.error("Function returned error:", data.error);
      console.error("Error context:", {
        response: data,
        statusCode: data.statusCode,
        message: data.message,
        details: data.details
      });
      throw new Error(data.error);
    }
    
    if (!data?.success) {
      console.error("Function did not return success:", data);
      throw new Error("Invitation failed without error");
    }
    
    console.log("Invitation sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Invitation failed:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint,
      response: error.response
    });
    throw error;
  }
};
