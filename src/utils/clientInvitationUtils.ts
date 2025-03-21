
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/emailUtils";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { createClientActivity } from "@/services/clientActivityService";
import { ExtendedActivityType } from "@/types/activity";

interface InvitationResult {
  success: boolean;
  error?: string;
}

export async function sendClientInvitation(
  clientId: string,
  clientName: string,
  email: string
): Promise<InvitationResult> {
  try {
    console.log(`Preparing to send invitation to client ${clientId} (${email})`);
    
    // Generate a temporary password
    const tempPassword = generateClientTempPassword();
    console.log("Generated temporary password");
    
    // Store the temporary password in the database
    const { error: tempPasswordError } = await supabase
      .from("client_temp_passwords")
      .insert({
        agent_id: clientId,
        email: email.trim().toLowerCase(),
        temp_password: tempPassword
      });
    
    if (tempPasswordError) {
      console.error("Error saving temporary password:", tempPasswordError);
      return {
        success: false,
        error: "Failed to generate secure credentials"
      };
    }
    
    console.log("Temporary password saved to database");
    
    // Call the edge function to create a user account
    const { data: userData, error: userError } = await supabase.functions.invoke("create-client-user", {
      body: {
        email: email.trim().toLowerCase(),
        client_id: clientId,
        client_name: clientName.trim(),
        temp_password: tempPassword
      }
    });

    if (userError) {
      console.error("Error creating user account:", userError);
      return {
        success: false,
        error: "Failed to create user account"
      };
    }

    console.log("User account created successfully:", userData);
    
    // Send welcome email with the temporary password
    console.log("Sending welcome email to:", email);
    
    const emailResult = await sendEmail({
      to: email.trim().toLowerCase(),
      subject: "Welcome to Welcome.Chat - Your Account Details",
      template: "client-invitation",
      params: {
        clientName: clientName.trim(),
        email: email.trim().toLowerCase(),
        tempPassword: tempPassword,
        productName: "Welcome.Chat"
      }
    });
    
    if (!emailResult.success) {
      console.error("Error sending welcome email:", emailResult.error);
      return {
        success: false,
        error: `Failed to send invitation email: ${emailResult.error}`
      };
    }
    
    console.log("Welcome email sent successfully");
    
    // Log the invitation in client activities using the service
    try {
      await createClientActivity(
        clientId,
        "invitation_sent" as ExtendedActivityType,
        "Client invitation email sent",
        {
          client_name: clientName.trim(),
          email: email.trim().toLowerCase()
        }
      );
    } catch (activityError) {
      console.error("Error logging invitation activity:", activityError);
      // Continue even if activity logging fails
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error("Error in sendClientInvitation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
