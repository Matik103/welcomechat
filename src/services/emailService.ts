
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends an email to notify the client that their account is scheduled for deletion
 * @param email Client's email address
 * @param clientName Client's name
 * @param deletionDate Date when the account will be deleted
 * @returns Result of the email operation
 */
export const sendDeletionEmail = async (
  email: string,
  clientName: string,
  deletionDate: Date
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!email || !email.includes('@')) {
      console.error("Invalid email address provided:", email);
      return { success: false, error: "Invalid email address" };
    }

    // Format the date in a user-friendly way
    const formattedDate = deletionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`Sending deletion notification email to ${email} for deletion on ${formattedDate}`);

    // Call the edge function to send the email
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        subject: "Important: Your Account Scheduled for Deletion",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #e11d48;">Account Deletion Notice</h1>
            </div>
            
            <p>Hello ${clientName},</p>
            
            <p>We're writing to inform you that your account has been scheduled for deletion. This action was requested by you or by an administrator.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Scheduled Deletion Date:</strong></p>
              <p style="color: #e11d48; font-size: 16px;">${formattedDate}</p>
            </div>
            
            <p>What you should know:</p>
            <ul>
              <li>All your data will be permanently deleted on the date specified above</li>
              <li>This process cannot be reversed after the deletion date</li>
              <li>If this was done in error, please sign in to your account to reactivate it</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://welcomeai.io/client/auth" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Sign In to Reactivate
              </a>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
            
            <p>Best regards,<br>The Support Team</p>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} All rights reserved.
            </div>
          </div>
        `,
        from: "Admin <admin@welcome.chat>"
      }
    });
    
    if (error) {
      console.error("Error sending deletion email:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Deletion email sent successfully");
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendDeletionEmail:", error);
    return { 
      success: false, 
      error: error.message || "Failed to send deletion notification email" 
    };
  }
};
