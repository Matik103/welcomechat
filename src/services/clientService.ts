
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
import { ExtendedActivityType } from "@/types/activity";
import { JsonObject, toJson } from "@/types/supabase-extensions";
import { WidgetSettings } from "@/types/widget-settings";
import { execSql } from "@/utils/rpcUtils";

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
        p_client_name: data.client_name,
        p_email: data.email,
        p_agent_name: sanitizedAgentName,
        p_agent_description: sanitizedAgentDescription,
        p_logo_url: data.widget_settings?.logo_url || null,
        p_logo_storage_path: data.widget_settings?.logo_storage_path || null,
        p_widget_settings: toJson(data.widget_settings || {}),
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

    // Use execSql instead of direct supabase access to clients table
    const query = `
      UPDATE clients
      SET 
        client_name = $1,
        email = $2,
        widget_settings = $3
      WHERE id = $4
    `;
    
    await execSql(query, [
      data.client_name, 
      data.email, 
      JSON.stringify(data.widget_settings || {}),
      clientId
    ]);

    // Also update ai_agents table if it exists - also using execSql
    const agentQuery = `
      UPDATE ai_agents
      SET 
        name = $1,
        agent_description = $2,
        logo_url = $3,
        logo_storage_path = $4,
        settings = $5
      WHERE client_id = $6
    `;
    
    await execSql(agentQuery, [
      sanitizedAgentName,
      sanitizedAgentDescription,
      data.widget_settings?.logo_url || null,
      data.widget_settings?.logo_storage_path || null,
      JSON.stringify(data.widget_settings || {}),
      clientId
    ]);
    
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
    // Use execSql to insert into client_activities
    const query = `
      INSERT INTO client_activities (
        client_id,
        activity_type,
        description,
        metadata
      ) VALUES (
        $1,
        $2,
        $3,
        $4
      )
    `;
    
    await execSql(query, [
      clientId,
      'client_updated',
      'Updated client information',
      '{}'
    ]);
    
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
    
    // Use execSql
    const query = `
      UPDATE clients
      SET 
        deletion_scheduled_at = $1,
        status = $2
      WHERE id = $3
    `;
    
    await execSql(query, [
      deletionScheduledTime.toISOString(),
      'deletion_scheduled',
      clientId
    ]);
    
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
    // Use execSql
    const query = `
      UPDATE clients
      SET 
        deleted_at = $1,
        status = $2
      WHERE id = $3
    `;
    
    await execSql(query, [
      new Date().toISOString(),
      'deleted',
      clientId
    ]);
    
  } catch (error: any) {
    console.error("Error in deleteClient:", error);
    throw new Error(error?.message || "Failed to delete client");
  }
};

/**
 * Retrieves a client by ID from the database.
 */
export const getClientById = async (clientId: string): Promise<any | null> => {
  try {
    // Use execSql
    const query = `
      SELECT *
      FROM clients
      WHERE id = $1
      LIMIT 1
    `;
    
    const result = await execSql(query, [clientId]);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      return null;
    }
    
    return result[0];
    
  } catch (error: any) {
    console.error("Error in getClientById:", error);
    return null;
  }
};

/**
 * Send an email invitation to a client.
 * Note: This API endpoint might need to be updated to match available functionality.
 */
export const inviteClient = async (email: string): Promise<any> => {
  try {
    // Use a Supabase Edge Function instead
    const { data, error } = await supabase.functions.invoke("create-client-user", {
      body: { email }
    });

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
 * Note: This needs to be updated to use the current Supabase resend method.
 */
export const resendInvite = async (email: string): Promise<any> => {
  try {
    // Use a more modern API for resending
    const { data, error } = await supabase.auth.resend({
      type: "signup",
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
