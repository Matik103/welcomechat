
import { ClientFormData } from "@/types/client-form";
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword, saveClientTempPassword, createClientUserAccount, logClientCreationActivity } from "./passwordUtils";

/**
 * Create a client record in the database
 */
export const createClientInDatabase = async (data: ClientFormData, clientId: string): Promise<any> => {
  try {
    console.log("Creating client in database with client_id:", clientId);
    
    // Sanitize agent name and description
    const sanitizedAgentName = data.widget_settings?.agent_name?.replace(/["']/g, "") || "AI Assistant";
    const sanitizedAgentDescription = data.widget_settings?.agent_description?.replace(/["']/g, "") || "";

    // Insert the client record
    const { data: newClient, error } = await supabase
      .from("ai_agents")
      .insert({
        client_name: data.client_name,
        email: data.email,
        name: sanitizedAgentName,
        agent_description: sanitizedAgentDescription,
        logo_url: data.widget_settings?.logo_url || null,
        logo_storage_path: data.widget_settings?.logo_storage_path || null,
        client_id: clientId, // Explicitly set the client_id
        content: "",
        interaction_type: 'config',
        settings: {
          client_name: data.client_name,
          email: data.email,
          agent_name: sanitizedAgentName,
          agent_description: sanitizedAgentDescription,
          logo_url: data.widget_settings?.logo_url,
          logo_storage_path: data.widget_settings?.logo_storage_path,
          client_id: clientId // Include client_id in settings for consistency
        }
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client in database:", error);
      throw new Error(error.message);
    }

    if (!newClient) {
      throw new Error("Failed to create client - no record returned");
    }

    console.log("Client created in database successfully:", newClient);
    return newClient;
  } catch (error: any) {
    console.error("Error in createClientInDatabase:", error);
    throw new Error(error?.message || "Failed to create client in database");
  }
};

/**
 * Set up a temporary password for a client and save it in the database
 */
export const setupClientPassword = async (clientId: string, email: string): Promise<string> => {
  try {
    // Generate a temporary password
    const tempPassword = generateClientTempPassword();
    
    // Save the temporary password
    await saveClientTempPassword(clientId, email, tempPassword);
    
    // Return the generated password
    return tempPassword;
  } catch (error: any) {
    console.error("Error in setupClientPassword:", error);
    throw new Error(error?.message || "Failed to setup client password");
  }
};
