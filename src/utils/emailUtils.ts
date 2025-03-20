
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  params: Record<string, any>;
}

// Sends an email using the edge function
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; message: string }> => {
  console.log("Sending email with options:", options);
  
  try {
    // Generate HTML for the email based on the template and parameters
    const html = generateEmailHtml(options.template, options.params);
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: options.to,
        subject: options.subject,
        html: html
      }
    });
    
    if (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email");
      return {
        success: false,
        message: error.message || "Unknown error occurred"
      };
    }
    
    console.log("Email sent successfully:", data);
    return {
      success: true,
      message: `Email sent successfully to ${options.to}`
    };
  } catch (error) {
    console.error("Error in sendEmail function:", error);
    toast.error("Failed to send email");
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Generate HTML for different email templates
function generateEmailHtml(template: string, params: Record<string, any>): string {
  switch (template) {
    case 'client-invitation':
      return generateClientInvitationEmail(params);
    default:
      return generateDefaultEmail(params);
  }
}

function generateClientInvitationEmail(params: Record<string, any>): string {
  const { clientName, email, tempPassword, productName } = params;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .container { padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .credentials { background-color: #f4f4f4; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${productName || 'AI Assistant'} - Your Account is Ready</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${clientName}!</h2>
          <p>Your account has been created. You can now access your AI assistant with the credentials below:</p>
          
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          
          <p>Please log in and change your password as soon as possible for security reasons.</p>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${productName || 'AI Chat Assistant'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDefaultEmail(params: Record<string, any>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
      </style>
    </head>
    <body>
      <h1>${params.subject || 'Notification'}</h1>
      <p>${params.message || 'This is a notification from our system.'}</p>
    </body>
    </html>
  `;
}
