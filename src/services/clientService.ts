
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
import { sendEmail } from "@/utils/emailUtils";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { sanitizeForSQL } from "@/utils/inputSanitizer";
import { toast } from "sonner";
import { createClientActivity } from "./clientActivityService";
import { syncWidgetSettingsWithAgent } from "@/utils/aiAgentSync";

// Handles the process of creating a new client
export const createClient = async (data: ClientFormData): Promise<string> => {
  console.log("Creating client with data:", { 
    client_name: data.client_name,
    email: data.email,
    agent_name: data.agent_name,
    agent_description: data.agent_description
  });
  
  try {
    // Ensure agent name is properly sanitized for SQL
    const sanitizedAgentName = sanitizeForSQL(data.agent_name || 'AI Assistant');
    console.log("Using sanitized agent name:", sanitizedAgentName);
    
    // Insert only client data into clients table
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .insert({
        client_name: data.client_name,
        email: data.email,
      })
      .select("id")
      .single();

    if (clientError) {
      console.error("Error creating client:", clientError);
      throw clientError;
    }

    const clientId = clientData.id;
    console.log(`Client created with ID: ${clientId}`);

    // Now create the AI agent entry
    const { error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_id: clientId,
        name: sanitizedAgentName,
        agent_description: data.agent_description || "",
        logo_url: data.logo_url || "",
        logo_storage_path: data.logo_storage_path || "",
        content: "", // Default empty content
        interaction_type: "config" // This is a configuration record
      });

    if (agentError) {
      console.error("Error creating AI agent:", agentError);
      // Don't throw here, we still want to continue with password creation
    } else {
      console.log("AI agent created for client ID:", clientId);
    }

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
      { 
        email: data.email,
        agent_name: sanitizedAgentName,
        has_agent_description: !!data.agent_description
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
    agent_name: data.agent_name,
    agent_description: data.agent_description
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

    // Sanitize agent name to prevent SQL issues
    const sanitizedAgentName = sanitizeForSQL(data.agent_name || 'AI Assistant');

    // Update only client data in clients table
    const { error: updateClientError } = await supabase
      .from("clients")
      .update({
        client_name: data.client_name,
        email: data.email,
      })
      .eq("id", clientId);

    if (updateClientError) {
      console.error("Error updating client:", updateClientError);
      throw updateClientError;
    }

    // Check if there's an existing AI agent entry
    const { data: existingAgent, error: checkAgentError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();

    if (checkAgentError) {
      console.error("Error checking existing AI agent:", checkAgentError);
    }

    if (existingAgent?.id) {
      // Update existing AI agent
      const { error: updateAgentError } = await supabase
        .from("ai_agents")
        .update({
          name: sanitizedAgentName,
          agent_description: data.agent_description || "",
          logo_url: data.logo_url || "",
          logo_storage_path: data.logo_storage_path || "",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingAgent.id);

      if (updateAgentError) {
        console.error("Error updating AI agent:", updateAgentError);
      } else {
        console.log("Updated AI agent for client ID:", clientId);
      }
    } else {
      // Create new AI agent entry if none exists
      const { error: createAgentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: sanitizedAgentName,
          agent_description: data.agent_description || "",
          logo_url: data.logo_url || "",
          logo_storage_path: data.logo_storage_path || "",
          content: "",
          interaction_type: "config",
          updated_at: new Date().toISOString()
        });

      if (createAgentError) {
        console.error("Error creating AI agent:", createAgentError);
      } else {
        console.log("Created new AI agent for client ID:", clientId);
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
