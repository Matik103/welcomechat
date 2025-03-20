
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
    
    // Insert client data into clients table
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert({
        client_name: data.client_name,
        email: data.email,
        widget_settings: widgetSettings,
        agent_name: widgetSettings.agent_name || 'AI Assistant' // Provide default value
      })
      .select("id")
      .single();

    if (clientError) {
      console.error("Error creating client:", clientError);
      throw clientError;
    }

    const clientId = clientData.id;
    console.log(`Client created with ID: ${clientId}`);

    // Generate a temporary password
    const tempPassword = generateClientTempPassword();
    console.log("Generated temp password");

    // Store the temporary password in the database
    const { error: tempPasswordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        client_id: clientId,
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
          clientId, 
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
      clientId,
      "client_created",
      `New client ${data.client_name} created`,
      { 
        email: data.email,
        agent_name: widgetSettings.agent_name || 'AI Assistant',
        has_agent_description: !!widgetSettings.agent_description
      }
    );

    return clientId;
  } catch (error) {
    console.error("Error in createClient function:", error);
    throw error;
  }
};

// Handles the process of updating an existing client
export const updateClient = async (
  clientId: string,
  data: ClientFormData
): Promise<string> => {
  console.log("Updating client with ID:", clientId, "and data:", { 
    client_name: data.client_name,
    email: data.email,
    widget_settings: data.widget_settings
  });
  
  try {
    // First, get the current client to compare changes
    const { data: currentClient, error: getError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (getError) {
      console.error("Error getting current client:", getError);
      throw getError;
    }

    // Ensure we have a widget_settings object
    const widgetSettings = data.widget_settings || {};

    // Update client data in clients table
    const { error: updateClientError } = await supabase
      .from("clients")
      .update({
        client_name: data.client_name,
        email: data.email,
        widget_settings: widgetSettings
      })
      .eq("id", clientId);

    if (updateClientError) {
      console.error("Error updating client:", updateClientError);
      throw updateClientError;
    }

    // Create or update OpenAI assistant if agent name is provided
    if (widgetSettings.agent_name) {
      try {
        await createOpenAIAssistant(
          clientId, 
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

    return clientId;
  } catch (error) {
    console.error("Error in updateClient function:", error);
    throw error;
  }
};

// Logs a client update activity
export const logClientUpdateActivity = async (clientId: string): Promise<void> => {
  try {
    await createClientActivity(
      clientId,
      "client_updated",
      "Client information updated",
      { updated_at: new Date().toISOString() }
    );
  } catch (error) {
    console.error("Error logging client update activity:", error);
    // Don't rethrow - we don't want to fail the update if logging fails
  }
};
