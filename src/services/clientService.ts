import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { JsonObject } from "@/types/supabase-extensions";
import { WidgetSettings } from "@/types/widget-settings";

/**
 * Creates a new client in the database.
 */
export const createClient = async (data: ClientFormData): Promise<string> => {
  try {
    // Sanitize agent name and description
    const sanitizedAgentName = data.widget_settings?.agent_name?.replace(/["']/g, "") || "";
    const sanitizedAgentDescription = data.widget_settings?.agent_description?.replace(/["']/g, "") || "";

    const { data: newClient, error } = await supabase.rpc(
      "create_new_client",
      {
        client_name_param: data.client_name,
        email_param: data.email,
        agent_name_param: sanitizedAgentName,
        agent_description_param: sanitizedAgentDescription,
        logo_url_param: data.widget_settings?.logo_url || null,
        logo_storage_path_param: data.widget_settings?.logo_storage_path || null,
        widget_settings_param: data.widget_settings as Json,
      }
    );

    if (error) {
      console.error("Error creating client:", error);
      throw new Error(error.message);
    }

    if (!newClient) {
      throw new Error("Failed to create new client");
    }

    return newClient as string;
  } catch (error: any) {
    console.error("Error in createClient:", error);
    throw new Error(error?.message || "Failed to create client");
  }
};

/**
 * Updates an existing client in the database.
 */
export const updateClient = async (
  clientId: string,
  data: ClientFormData
): Promise<void> => {
  try {
    // Sanitize agent name and description
    const sanitizedAgentName = data.widget_settings?.agent_name?.replace(/["']/g, "") || "";
    const sanitizedAgentDescription = data.widget_settings?.agent_description?.replace(/["']/g, "") || "";

    const { error } = await supabase.from("clients").update({
      client_name: data.client_name,
      email: data.email,
      widget_settings: data.widget_settings as Json,
    }).eq("id", clientId);

    if (error) {
      console.error("Error updating client:", error);
      throw new Error(error.message);
    }

    // Also update ai_agents table if it exists
    const { error: agentError } = await supabase
      .from('ai_agents')
      .update({
        name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        logo_url: data.widget_settings?.logo_url || null,
        logo_storage_path: data.widget_settings?.logo_storage_path || null,
        settings: data.widget_settings as Json,
      })
      .eq('client_id', clientId);

    if (agentError) {
      console.warn("Could not sync settings to ai_agents table:", agentError);
      // This is not critical, we still consider the update successful
    }
  } catch (error: any) {
    console.error("Error updating client:", error);
    throw new Error(error?.message || "Failed to update client");
  }
};

/**
 * Logs client update activity.
 */
export const logClientUpdateActivity = async (
  clientId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "client_updated",
        description: "Updated client information",
        metadata: {},
      });

    if (error) {
      console.error("Error logging client update activity:", error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error("Error in logClientUpdateActivity:", error);
    throw new Error(
      error?.message || "Failed to log client update activity"
    );
  }
};

/**
 * Schedules a client for deletion.
 */
export const scheduleClientDeletion = async (
  clientId: string
): Promise<void> => {
  try {
    const deletionScheduledTime = new Date();
    deletionScheduledTime.setDate(deletionScheduledTime.getDate() + 30);

    const { error } = await supabase
      .from("clients")
      .update({
        deletion_scheduled_at: deletionScheduledTime.toISOString(),
        status: "deletion_scheduled",
      })
      .eq("id", clientId);

    if (error) {
      console.error("Error scheduling client deletion:", error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error("Error in scheduleClientDeletion:", error);
    throw new Error(
      error?.message || "Failed to schedule client deletion"
    );
  }
};

/**
 * Permanently deletes a client from the database.
 */
export const deleteClient = async (clientId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("clients")
      .update({
        deleted_at: new Date().toISOString(),
        status: "deleted",
      })
      .eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error("Error in deleteClient:", error);
    throw new Error(error?.message || "Failed to delete client");
  }
};

/**
 * Retrieves all clients from the database.
 */
export const getAllClients = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.from("clients").select("*");

    if (error) {
      console.error("Error fetching clients:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error("Error in getAllClients:", error);
    throw new Error(error?.message || "Failed to fetch clients");
  }
};

/**
 * Retrieves a client by ID from the database.
 */
export const getClientById = async (clientId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      return null;
    }

    return data || null;
  } catch (error: any) {
    console.error("Error in getClientById:", error);
    return null;
  }
};

/**
 * Sends an invitation email to the client.
 */
export const inviteClient = async (email: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.inviteUserByEmail(email);

    if (error) {
      console.error("Error inviting client:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error("Error in inviteClient:", error);
    throw new Error(error?.message || "Failed to invite client");
  }
};

/**
 * Resends an invitation email to the client.
 */
export const resendInvite = async (email: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: "invite",
      email: email,
    });

    if (error) {
      console.error("Error resending invite:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error("Error in resendInvite:", error);
    throw new Error(error?.message || "Failed to resend invite");
  }
};

/**
 * Converts widget settings to a JSON object for database storage
 */
export const widgetSettingsToJson = (settings: Partial<WidgetSettings>): JsonObject => {
  return settings as JsonObject;
};
