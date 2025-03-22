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

    // Insert directly into the ai_agents table instead of using create_new_client RPC
    const { data: newClient, error } = await supabase
      .from("ai_agents")
      .insert({
        name: sanitizedAgentName || "AI Assistant",
        agent_description: sanitizedAgentDescription,
        logo_url: data.widget_settings?.logo_url || null,
        logo_storage_path: data.widget_settings?.logo_storage_path || null,
        status: 'active',
        content: '',
        interaction_type: 'config',
        client_name: data.client_name,
        email: data.email,
        settings: {
          client_name: data.client_name,
          email: data.email,
          agent_name: sanitizedAgentName || "AI Assistant",
          agent_description: sanitizedAgentDescription,
          logo_url: data.widget_settings?.logo_url,
          logo_storage_path: data.widget_settings?.logo_storage_path
        }
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating client:", error);
      throw new Error(error.message);
    }

    if (!newClient) {
      throw new Error("Failed to create new client");
    }

    // Add client activity
    try {
      await supabase.from("client_activities").insert({
        client_id: newClient.id,
        activity_type: "client_created",
        description: "New client created with AI agent: " + sanitizedAgentName,
        metadata: {
          client_name: data.client_name,
          email: data.email,
          agent_name: sanitizedAgentName
        }
      });
    } catch (activityError) {
      console.error("Error creating client activity:", activityError);
      // Continue even if activity logging fails
    }

    return newClient.id;
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

    // Create settings object
    const settings = {
      client_name: data.client_name,
      email: data.email,
      agent_name: sanitizedAgentName || "AI Assistant",
      agent_description: sanitizedAgentDescription,
      logo_url: data.widget_settings?.logo_url || "",
      logo_storage_path: data.widget_settings?.logo_storage_path || ""
    };

    console.log("Updating client with data:", {
      clientId,
      clientName: data.client_name,
      email: data.email,
      agentName: sanitizedAgentName,
      agentDescription: sanitizedAgentDescription,
      logoUrl: data.widget_settings?.logo_url,
      logoStoragePath: data.widget_settings?.logo_storage_path,
      settings: settings
    });

    // First check if we need to upload a new logo file
    if (data._tempLogoFile) {
      console.log("Uploading new logo file:", data._tempLogoFile.name);
      
      // Create a storage path for the logo
      const fileExt = data._tempLogoFile.name.split('.').pop();
      const fileName = `${clientId}-logo-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `${clientId}/logos/${fileName}`;
      
      // Upload the file to client_documents bucket instead of client-assets
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(storagePath, data._tempLogoFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error("Error uploading logo:", uploadError);
        throw uploadError;
      }
      
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('client_documents')
        .getPublicUrl(storagePath);
      
      const publicUrl = publicUrlData?.publicUrl;
      
      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded logo');
      }
      
      console.log("Logo uploaded successfully, public URL:", publicUrl);
      
      // Update the logo URL and storage path in the settings
      settings.logo_url = publicUrl;
      settings.logo_storage_path = storagePath;
    }

    // Update in the ai_agents table directly using execSql
    const updateQuery = `
      UPDATE ai_agents
      SET 
        client_name = $1,
        email = $2,
        name = $3,
        agent_description = $4,
        logo_url = $5,
        logo_storage_path = $6,
        settings = $7,
        updated_at = NOW()
      WHERE id = $8 OR client_id = $8
      RETURNING id
    `;
    
    const result = await execSql(updateQuery, [
      data.client_name,
      data.email,
      sanitizedAgentName || "AI Assistant",
      sanitizedAgentDescription,
      settings.logo_url,
      settings.logo_storage_path,
      JSON.stringify(settings),
      clientId
    ]);
    
    if (!result || result.length === 0) {
      throw new Error("Failed to update client information");
    }
    
    console.log("Updated ai_agents record successfully:", result);
    
    // Log activity
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_updated",
      description: "Client information updated",
      metadata: {
        client_name: data.client_name,
        email: data.email,
        logo_updated: !!data._tempLogoFile
      }
    });
    
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
    // Use direct SQL for client_activities
    const query = `
      INSERT INTO client_activities (client_id, activity_type, description, metadata)
      VALUES ($1, $2, $3, $4)
    `;
    
    await execSql(query, [
      clientId,
      'client_updated',
      'Updated client information',
      JSON.stringify({})
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
    
    // Use SQL for updating ai_agents
    const query = `
      UPDATE ai_agents
      SET deletion_scheduled_at = $1, status = $2
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
    // Use SQL for updating client deletion status
    const query = `
      UPDATE ai_agents
      SET deleted_at = $1, status = $2
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
    // Use execSql to query the database instead of direct Supabase access
    const query = `
      SELECT * FROM ai_agents
      WHERE id = $1
      LIMIT 1
    `;
    
    const result = await execSql(query, [clientId]);
    
    if (result && Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    
    return null;
    
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
