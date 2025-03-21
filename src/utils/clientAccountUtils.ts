
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword } from "./passwordUtils";

/**
 * Sets up a temporary password for the client and stores it in the database
 */
export const setupClientPassword = async (clientId: string, email: string) => {
  // Generate a temporary password for this client
  const tempPassword = generateClientTempPassword();
  console.log("Generated temporary password:", tempPassword);
  
  // Store the temporary password in the database
  try {
    const { error: tempPasswordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword
      });
    
    if (tempPasswordError) {
      console.error("Error saving temporary password:", tempPasswordError);
      throw new Error("Failed to save temporary password");
    }
    
    console.log("Temporary password saved to database");
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
  console.log("Starting user account creation for:", email);
  
  // Call the edge function to create a user
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

  console.log("User account created successfully:", userData);
  return userData;
};

/**
 * Creates a client in the database
 */
export const createClientInDatabase = async (validatedData: any) => {
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
