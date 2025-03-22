
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a secure temporary password for a client account
 */
export const generateTempPassword = (): string => {
  const currentYear = new Date().getFullYear();
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 100-999
  return `Welcome${currentYear}#${randomDigits}`;
};

/**
 * Saves a client's temporary password in the database
 */
export const saveClientTempPassword = async (
  clientId: string, 
  email: string, 
  tempPassword: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email,
        temp_password: tempPassword
      });

    if (error) {
      console.error("Error saving temporary password:", error);
      throw new Error("Failed to save temporary password");
    }
  } catch (error) {
    console.error("Error in saveClientTempPassword:", error);
    throw error;
  }
};

/**
 * Logs a client creation activity
 */
export const logClientCreationActivity = async (
  clientId: string,
  clientName: string,
  email: string,
  agentName: string
): Promise<void> => {
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
  } catch (error) {
    console.error("Error logging client creation activity:", error);
    // Continue even if activity logging fails
  }
};
