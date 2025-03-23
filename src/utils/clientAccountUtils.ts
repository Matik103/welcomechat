
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword } from "./passwordUtils";

/**
 * Sets up a temporary password for the client and stores it in the database
 * @param clientId The ID from the ai_agents table
 * @param email Client's email address
 * @returns The generated temporary password
 */
export const setupClientPassword = async (clientId: string, email: string) => {
  // Generate a temporary password for this client
  const tempPassword = generateClientTempPassword();
  console.log("Generated temporary password:", tempPassword);
  
  // Store the temporary password in the database using client_id as primary identifier
  try {
    // First check if there's already a password for this client_id
    const { data: existingPasswords, error: checkError } = await supabase
      .from("client_temp_passwords")
      .select("id, temp_password")
      .eq("agent_id", clientId)
      .order('id', { ascending: false })
      .limit(1);
    
    if (checkError) {
      console.error("Error checking existing temporary passwords:", checkError);
    } else if (existingPasswords && existingPasswords.length > 0) {
      console.log("Found existing temporary password for client_id:", clientId);
      // Return the existing password to avoid creating duplicates
      return existingPasswords[0].temp_password;
    }
    
    // No existing password found, create a new one
    const { error: tempPasswordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        email: email,
        temp_password: tempPassword,
        agent_id: clientId
      });
    
    if (tempPasswordError) {
      console.error("Error saving temporary password:", tempPasswordError);
      throw new Error("Failed to save temporary password");
    }
    
    console.log("Temporary password saved to database for client_id:", clientId);
    return tempPassword;
  } catch (passwordError) {
    console.error("Error in password creation process:", passwordError);
    throw new Error("Failed to generate secure credentials");
  }
};

/**
 * Creates a user account for the client
 */
export const createClientUserAccount = async (
  email: string, 
  clientId: string, 
  clientName: string, 
  agentName: string, 
  agentDescription: string, 
  tempPassword: string
) => {
  console.log("Starting user account creation for client_id:", clientId);
  
  // Call the edge function to create a user, using client_id as the primary identifier
  const { data: userData, error: userError } = await supabase.functions.invoke("create-client-user", {
    body: {
      email: email,
      client_id: clientId,
      client_name: clientName,
      agent_name: agentName,
      agent_description: agentDescription,
      temp_password: tempPassword
    }
  });

  if (userError) {
    console.error("Error creating user account:", userError);
    throw new Error("Failed to create user account");
  }

  console.log("User account created successfully with client_id:", clientId);
  return userData;
};

/**
 * Creates a client in the database
 */
export const createClientInDatabase = async (validatedData: any, clientId?: string) => {
  console.log("Creating client with data:", validatedData);

  // Create the client directly in the ai_agents table
  const { data: newAgent, error } = await supabase
    .from("ai_agents")
    .insert({
      name: validatedData.widget_settings?.agent_name?.trim() || "AI Assistant",
      agent_description: validatedData.widget_settings?.agent_description?.trim() || "",
      logo_url: validatedData.widget_settings?.logo_url || "",
      status: 'active',
      content: '',
      interaction_type: 'config',
      client_name: validatedData.client_name.trim(),
      email: validatedData.email.trim().toLowerCase(),
      client_id: clientId, // Use the provided clientId if available
      settings: {
        client_name: validatedData.client_name.trim(),
        email: validatedData.email.trim().toLowerCase(),
        agent_name: validatedData.widget_settings?.agent_name?.trim() || "AI Assistant",
        agent_description: validatedData.widget_settings?.agent_description?.trim() || "",
        logo_url: validatedData.widget_settings?.logo_url || ""
      }
    })
    .select("id, client_id")
    .single();

  if (error) {
    console.error("Error creating client in ai_agents:", error);
    throw new Error(error.message || "Failed to create client");
  }

  if (!newAgent) {
    throw new Error("Failed to create client record");
  }

  // Important: Set client_id to its own id if not provided
  if (!newAgent.client_id) {
    const { error: updateError } = await supabase
      .from("ai_agents")
      .update({ client_id: newAgent.id })
      .eq("id", newAgent.id);
      
    if (updateError) {
      console.error("Error setting client_id to agent's own id:", updateError);
      throw new Error(`Failed to set client_id: ${updateError.message}`);
    } else {
      console.log("Successfully set client_id to agent's own id:", newAgent.id);
      // Update our local copy of newAgent
      newAgent.client_id = newAgent.id;
    }
  }

  console.log("Client created successfully:", newAgent);
  return newAgent;
};

/**
 * Logs the client creation activity
 */
export const logClientCreationActivity = async (clientId: string, clientName: string, email: string, agentName: string) => {
  try {
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_created",
      description: "New client created with AI agent",
      metadata: {
        client_name: clientName,
        email: email,
        agent_name: agentName
      }
    });
  } catch (activityError) {
    console.error("Error logging client creation activity:", activityError);
    // Continue even if activity logging fails
  }
};
