
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
import { sendEmail } from "@/utils/emailUtils";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { sanitizeForSQL } from "@/utils/inputSanitizer";
import { toast } from "sonner";
import { createClientActivity } from "./clientActivityService";
import { syncWidgetSettingsWithAgent } from "@/utils/aiAgentSync";
import { createOpenAIAssistant } from "@/utils/openAIUtils";

// Handles the process of creating a new client
export const createClient = async (data: ClientFormData): Promise<string> => {
  console.log("Creating client with data:", { 
    client_name: data.client_name,
    email: data.email,
    widget_settings: data.widget_settings
  });
  
  try {
    // Ensure we have a widget_settings object
    const widgetSettings = data.widget_settings || {};
    
    // Validate required fields to prevent null values
    if (!data.client_name || !data.email) {
      throw new Error("Client name and email are required");
    }
    
    // Insert client data into ai_agents table
    const { data: agentData, error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_name: data.client_name,
        email: data.email,
        name: widgetSettings.agent_name || 'Assistant', // Set AI agent name
        agent_description: widgetSettings.agent_description || '',
        logo_url: widgetSettings.logo_url || '',
        logo_storage_path: widgetSettings.logo_storage_path || '',
        settings: widgetSettings,
        interaction_type: 'config',
        status: 'active'
      })
      .select("id")
      .single();

    if (agentError) {
      console.error("Error creating client:", agentError);
      throw agentError;
    }

    const agentId = agentData.id;
    console.log(`Client created with ID: ${agentId}`);

    // Generate a temporary password
    const tempPassword = generateClientTempPassword();
    console.log("Generated temp password");

    // Store the temporary password in the database
    const { error: tempPasswordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: agentId, // Using agent_id instead of client_id now
        email: data.email,
        temp_password: tempPassword
      });

    if (tempPasswordError) {
      console.error("Error saving temporary password:", tempPasswordError);
      throw tempPasswordError;
    }
    console.log("Saved temporary password to database");

    try {
      // Send invitation email with temporary password
      const emailResult = await sendEmail({
        to: data.email,
        subject: "Welcome to Chat Bot - Your Account is Ready",
        template: "client-invitation",
        params: {
          clientName: data.client_name,
          email: data.email,
          tempPassword: tempPassword,
          productName: "Chat Bot"
        }
      });
      console.log("Email sending result:", emailResult);
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Log the error but don't fail the client creation
      toast.error("Failed to send invitation email, but client was created successfully.");
    }

    // Create OpenAI assistant if agent name and description are provided
    if (widgetSettings.agent_name) {
      try {
        await createOpenAIAssistant(
          agentId, 
          widgetSettings.agent_name, 
          widgetSettings.agent_description || "",
          data.client_name
        );
        console.log("OpenAI assistant created/updated successfully");
      } catch (assistantError) {
        console.error("Error creating/updating OpenAI assistant:", assistantError);
        // Don't fail client creation if assistant creation fails
        toast.error("Failed to create OpenAI assistant, but client was created successfully.");
      }
    }

    // Log client creation activity
    await createClientActivity(
      agentId,
      "client_created",
      `New client ${data.client_name} created`,
      { 
        email: data.email,
        agent_name: widgetSettings.agent_name || 'Assistant',
        has_agent_description: !!widgetSettings.agent_description
      }
    );

    return agentId;
  } catch (error) {
    console.error("Error in createClient function:", error);
    throw error;
  }
};

// Handles the process of updating an existing client
export const updateClient = async (
  agentId: string,
  data: ClientFormData
): Promise<string> => {
  console.log("Updating client with ID:", agentId, "and data:", { 
    client_name: data.client_name,
    email: data.email,
    widget_settings: data.widget_settings
  });
  
  try {
    // First, get the current client to compare changes
    const { data: currentAgent, error: getError } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (getError) {
      console.error("Error getting current client:", getError);
      throw getError;
    }

    // Ensure we have a widget_settings object
    const widgetSettings = data.widget_settings || {};

    // Update client data in ai_agents table
    const { error: updateAgentError } = await supabase
      .from("ai_agents")
      .update({
        client_name: data.client_name,
        email: data.email,
        name: widgetSettings.agent_name || 'Assistant',
        agent_description: widgetSettings.agent_description || '',
        logo_url: widgetSettings.logo_url || '',
        logo_storage_path: widgetSettings.logo_storage_path || '',
        settings: widgetSettings
      })
      .eq("id", agentId);

    if (updateAgentError) {
      console.error("Error updating client:", updateAgentError);
      throw updateAgentError;
    }

    // Create or update OpenAI assistant if agent name is provided
    if (widgetSettings.agent_name) {
      try {
        await createOpenAIAssistant(
          agentId, 
          widgetSettings.agent_name, 
          widgetSettings.agent_description || "",
          data.client_name
        );
        console.log("OpenAI assistant created/updated successfully");
      } catch (assistantError) {
        console.error("Error creating/updating OpenAI assistant:", assistantError);
        // Don't fail client update if assistant update fails
        toast.error("Failed to update OpenAI assistant, but client was updated successfully.");
      }
    }

    return agentId;
  } catch (error) {
    console.error("Error in updateClient function:", error);
    throw error;
  }
};

// Logs a client update activity
export const logClientUpdateActivity = async (agentId: string): Promise<void> => {
  try {
    await createClientActivity(
      agentId,
      "client_updated",
      "Client information updated",
      { updated_at: new Date().toISOString() }
    );
  } catch (error) {
    console.error("Error logging client update activity:", error);
    // Don't rethrow - we don't want to fail the update if logging fails
  }
};
