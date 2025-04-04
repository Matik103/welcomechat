
import { supabase } from "@/integrations/supabase/client";
import { createClientActivity } from "./clientActivityService";
import { ActivityType } from "@/types/activity";

export const createClient = async (clientData: {
  name: string;
  email: string;
  status?: string;
  agent_name?: string;
}) => {
  try {
    const { data, error } = await supabase.from("clients").insert([
      {
        client_name: clientData.name,
        email: clientData.email,
        status: clientData.status || "active",
        agent_name: clientData.agent_name || clientData.name,
      },
    ]).select();

    if (error) {
      console.error("Error creating client:", error);
      return { success: false, error };
    }

    const newClientId = data[0].id;

    // Log client creation
    await createClientActivity(
      newClientId,
      clientData.name,
      ActivityType.CLIENT_CREATED,
      `Client ${clientData.name} created`,
      { client_email: clientData.email }
    );

    return { success: true, data: data[0] };
  } catch (err) {
    console.error("Exception creating client:", err);
    return { success: false, error: err };
  }
};

export const getClient = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Exception fetching client:", err);
    return { success: false, error: err };
  }
};

export const updateClient = async (
  clientId: string,
  clientData: {
    name?: string;
    email?: string;
    status?: string;
    agent_name?: string;
  }
) => {
  try {
    const updatePayload: any = {};
    
    if (clientData.name) updatePayload.client_name = clientData.name;
    if (clientData.email) updatePayload.email = clientData.email;
    if (clientData.status) updatePayload.status = clientData.status;
    if (clientData.agent_name) updatePayload.agent_name = clientData.agent_name;
    
    const { data, error } = await supabase
      .from("clients")
      .update(updatePayload)
      .eq("id", clientId)
      .select();

    if (error) {
      console.error("Error updating client:", error);
      return { success: false, error };
    }

    // Log client update
    await createClientActivity(
      clientId,
      clientData.name || "",
      ActivityType.CLIENT_UPDATED,
      `Client information updated`,
      { 
        updated_fields: Object.keys(clientData),
        client_email: clientData.email 
      }
    );

    return { success: true, data: data[0] };
  } catch (err) {
    console.error("Exception updating client:", err);
    return { success: false, error: err };
  }
};

export const deleteClient = async (clientId: string) => {
  try {
    // Get client info before deleting for the activity log
    const { data: clientData } = await supabase
      .from("clients")
      .select("client_name, email")
      .eq("id", clientId)
      .single();
      
    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception deleting client:", err);
    return { success: false, error: err };
  }
};

export const getClients = async () => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return { success: false, error, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error("Exception fetching clients:", err);
    return { success: false, error: err, data: [] };
  }
};
