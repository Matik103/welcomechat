
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
import { sendEmail } from "@/utils/emailUtils";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { sanitizeForSQL } from "@/utils/inputSanitizer";
import { toast } from "sonner";
import { createClientActivity } from "./clientActivityService";

// Handles the process of creating a new client
export const createClient = async (data: ClientFormData): Promise<string> => {
  console.log("Creating client with data:", { ...data, widget_settings: "..." });
  
  try {
    // Ensure agent name is properly sanitized for SQL
    const sanitizedAgentName = sanitizeForSQL(data.agent_name || 'AI Assistant');
    console.log("Using sanitized agent name:", sanitizedAgentName);
    
    // Create the client record in the database using raw SQL with parameter binding
    // This avoids SQL syntax errors with special characters
    const { data: newClient, error } = await supabase.rpc(
      'create_new_client',
      {
        p_client_name: data.client_name,
        p_email: data.email,
        p_agent_name: sanitizedAgentName,
        p_logo_url: data.logo_url || null,
        p_logo_storage_path: data.logo_storage_path || null,
        p_widget_settings: {
          logo_url: data.logo_url || "",
          logo_storage_path: data.logo_storage_path || ""
        }
      }
    );

    if (error) {
      console.error("Error creating client:", error);
      throw error;
    }

    const clientId = newClient;
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

    // Log client creation activity
    await createClientActivity(
      clientId,
      "client_created",
      `New client ${data.client_name} created`,
      { email: data.email }
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
  console.log("Updating client with ID:", clientId, "and data:", { ...data, widget_settings: "..." });
  
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

    // Sanitize agent name to prevent SQL issues
    const sanitizedAgentName = sanitizeForSQL(data.agent_name || 'AI Assistant');

    // Prepare update data with widget_settings correctly handled
    const updateData: any = {
      client_name: data.client_name,
      email: data.email,
      agent_name: sanitizedAgentName,
    };

    // Prepare widget_settings
    let widgetSettings: Record<string, any> = typeof data.widget_settings === 'object' && data.widget_settings !== null 
      ? { ...data.widget_settings as Record<string, any> }
      : {};
      
    // Add logo data to widget_settings
    widgetSettings.logo_url = data.logo_url || "";
    widgetSettings.logo_storage_path = data.logo_storage_path || "";
    
    // Set the final widget_settings in update data
    updateData.widget_settings = widgetSettings;

    // Update the client record
    const { error: updateError } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", clientId);

    if (updateError) {
      console.error("Error updating client:", updateError);
      throw updateError;
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
