
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
    
    console.log("Generated HTML email content, calling send-email edge function...");
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: options.to,
        subject: options.subject,
        html: html
      }
    });
    
    if (error) {
      console.error("Failed to send email - Edge function error:", error);
      toast.error("Failed to send email");
      return {
        success: false,
        message: error.message || "Unknown error occurred while calling send-email function"
      };
    }
    
    if (!data || data.success === false) {
      const errorMessage = data?.error || "Unknown error occurred";
      console.error("Email sending failed:", errorMessage, data?.details);
      toast.error(`Failed to send email: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage
      };
    }
    
    console.log("Email sent successfully:", data);
    toast.success(`Email sent successfully to ${options.to}`);
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
  const { clientName, email, tempPassword, productName = 'Welcome.Chat' } = params;
  const baseUrl = window.location.origin;
  const loginUrl = `${baseUrl}/auth`;
  const currentYear = new Date().getFullYear();
  
  // Validate required parameters
  if (!email || !tempPassword) {
    console.error("Missing required parameters for client invitation email", { email, tempPassword });
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${productName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0;
          background-color: #f9f9f9;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          text-align: center; 
          padding: 20px 0; 
          border-bottom: 1px solid #eaeaea;
        }
        .header h1 {
          color: #4F46E5;
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 20px 0; 
        }
        .credentials-box { 
          background-color: #f7f9fc; 
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 5px; 
          border-left: 4px solid #4F46E5;
        }
        .steps {
          margin: 25px 0;
          padding-left: 20px;
        }
        .steps li {
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #3c348d;
        }
        .security-notice {
          background-color: #fffaf0;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #f59e0b;
          margin: 20px 0;
        }
        .footer { 
          text-align: center;
          font-size: 12px; 
          color: #666; 
          padding-top: 20px;
          border-top: 1px solid #eaeaea;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${productName}!</h1>
        </div>
        
        <div class="content">
          <p>Hello ${clientName || 'Client'},</p>
          
          <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
          
          <div class="credentials-box">
            <p><strong>Email Address:</strong></p>
            <p>${email}</p>
            
            <p><strong>Temporary Password:</strong></p>
            <p>${tempPassword}</p>
          </div>
          
          <p><strong>To get started:</strong></p>
          <ol class="steps">
            <li>Click the "Sign In" button below</li>
            <li>Enter your email and temporary password exactly as shown above</li>
            <li>You'll be taken to your client dashboard</li>
            <li>Configure your AI assistant's settings</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Sign In</a>
          </div>
          
          <div class="security-notice">
            <p><strong>Security Notice:</strong></p>
            <p>This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
          </div>
          
          <p>Best regards,<br>The ${productName} Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${currentYear} ${productName}. All rights reserved.</p>
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
