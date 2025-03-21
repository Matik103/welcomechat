
import { supabase } from "@/integrations/supabase/client";

interface EmailParams {
  [key: string]: string | number | boolean | null;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  params?: EmailParams;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Sends an email using the send-email edge function
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResponse> => {
  try {
    console.log("Sending email to:", options.to);
    
    let html = options.html || "";
    
    // If template is specified, build the HTML from the template
    if (options.template === "client-invitation") {
      // Use params to populate the template
      const params = options.params || {};
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5;">Welcome to ${params.productName || 'Welcome.Chat'}!</h1>
          </div>
          
          <p>Hello ${params.clientName},</p>
          
          <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email Address:</strong></p>
            <p style="color: #4f46e5;">${params.email}</p>
            
            <p><strong>Temporary Password:</strong></p>
            <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${params.tempPassword}</p>
          </div>
          
          <p>To get started:</p>
          <ol>
            <li>Click the "Sign In" button below</li>
            <li>Enter your email and temporary password exactly as shown above</li>
            <li>You'll be taken to your client dashboard</li>
            <li>Configure your AI assistant's settings</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.VITE_APP_URL || 'https://app.welcome.chat'}/client/auth" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Sign In
            </a>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
            <p><strong>Security Notice:</strong></p>
            <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
          </div>
          
          <p>Best regards,<br>The ${params.productName || 'Welcome.Chat'} Team</p>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} ${params.productName || 'Welcome.Chat'}. All rights reserved.
          </div>
        </div>
      `;
    }
    
    if (!html) {
      throw new Error("Email content is required. Provide either 'html' or a valid 'template'.");
    }
    
    // Call the edge function to send the email
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: options.to,
        subject: options.subject,
        html: html,
        from: options.from
      }
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      return {
        success: false,
        error: error.message || "Failed to send email"
      };
    }
    
    console.log("Email sent successfully:", data);
    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error("Error sending email:", err);
    return {
      success: false,
      error: err.message || "An error occurred while sending the email"
    };
  }
};
