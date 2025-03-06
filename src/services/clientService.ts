
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientFormData } from "@/types/client";
import { toast } from "sonner";

/**
 * Fetches a single client by ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  if (!id) return null;
  
  console.log("Fetching client with ID:", id);
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching client:", error);
    throw error;
  }
  
  console.log("Client data retrieved:", data);
  return data as Client;
};

/**
 * Updates an existing client
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  console.log("Updating client with ID:", id);
  console.log("Update data:", data);

  try {
    const { data: updatedData, error } = await supabase
      .from("clients")
      .update({
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        widget_settings: data.widget_settings,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating client:", error);
      throw error;
    }

    console.log("Client updated successfully:", updatedData);
    return id;
  } catch (error) {
    console.error("Exception in updateClient:", error);
    throw error;
  }
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
  console.log("Creating new client with data:", data);
  
  // Sanitize the agent name to ensure it's valid for DB operations
  const sanitizedAgentName = data.agent_name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  
  const { data: newClients, error } = await supabase
    .from("clients")
    .insert([{
      client_name: data.client_name,
      email: data.email,
      agent_name: sanitizedAgentName,
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
  
  console.log("Client created successfully:", newClients[0]);
  return newClients[0].id;
};

/**
 * Sends invitation email to a client using Supabase's built-in invitation system
 */
export const sendInvitation = async (clientId: string, email: string, clientName: string): Promise<boolean> => {
  try {
    console.log("Sending invitation for client:", clientId, email, clientName);
    
    // Call the edge function to send the Supabase invitation
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
    
    if (data?.success) {
      toast.success("Invitation sent successfully");
      return true;
    } else {
      throw new Error("Invitation failed to send");
    }
    
  } catch (error) {
    console.error("Invitation failed:", error);
    
    // Try fallback email as last resort
    try {
      console.log("Attempting to send fallback email notification");
      await sendFallbackEmail(email);
    } catch (fallbackError) {
      console.error("Even fallback email failed:", fallbackError);
    }
    
    toast.error("Failed to send invitation. The account was created but the user will need to be notified manually.");
    throw error;
  }
};

/**
 * Sends a fallback email when invitation fails
 */
export const sendFallbackEmail = async (email: string): Promise<void> => {
  try {
    const { data: emailData, error: emailError } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: "Welcome to Welcome.Chat",
        html: `
          <h1>Welcome to Welcome.Chat!</h1>
          <p>Your account has been created. You'll receive a separate email with login instructions.</p>
          <p>You can access your dashboard at: ${window.location.origin}/client/view</p>
          <p>Thank you,<br>The Welcome.Chat Team</p>
        `
      }
    });
    
    if (emailError) {
      console.error("Error sending fallback email:", emailError);
      throw emailError;
    } else {
      console.log("Fallback email sent successfully:", emailData);
    }
  } catch (fallbackError) {
    console.error("Failed to send fallback email:", fallbackError);
    throw fallbackError;
  }
};
