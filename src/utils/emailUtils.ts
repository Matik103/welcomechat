
import { supabase } from "@/integrations/supabase/client";

interface EmailResponse {
  success: boolean;
  error?: string;
  details?: any;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  template?: "client-invitation";
  from?: string;
  params?: {
    clientName?: string;
    email?: string;
    tempPassword?: string;
    productName?: string;
    [key: string]: any;
  };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sends an email using the send-email edge function
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  let retries = 0;
  let lastError: any = null;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Attempt ${retries + 1} of ${MAX_RETRIES} to send email`);
      
      let html = options.html || "";

      console.log("Sending email with options:", {
        to: options.to,
        subject: options.subject,
        hasHtml: !!options.html,
        template: options.template,
        hasParams: !!options.params,
        from: options.from || "default"
      });

      // If a template is specified, generate the HTML content
      if (options.template === "client-invitation") {
        // Use params to populate the template
        const params = options.params || {};
        
        if (!params.clientName || !params.email || !params.tempPassword) {
          throw new Error("Missing required parameters for client invitation template");
        }
        
        console.log("Building client invitation template with params:", {
          clientName: params.clientName || 'Unknown',
          email: params.email || 'No email provided',
          hasPassword: !!params.tempPassword,
          productName: params.productName || 'Unknown'
        });
        
        if (!params.email || !params.tempPassword) {
          console.error("Missing required template parameters:", {
            hasEmail: !!params.email,
            hasPassword: !!params.tempPassword
          });
          return {
            success: false,
            error: "Missing required template parameters for client invitation"
          };
        }
        
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4f46e5;">Welcome to ${params.productName || 'Welcome.Chat'}!</h1>
            </div>
            
            <p>Hello ${params.clientName || 'Client'},</p>
            
            <p>Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email Address:</strong></p>
              <p style="color: #4f46e5;">${params.email || ''}</p>
              
              <p><strong>Temporary Password:</strong></p>
              <p style="color: #4f46e5; font-family: monospace; font-size: 16px;">${params.tempPassword || ''}</p>
            </div>
            
            <p>To get started:</p>
            <ol>
              <li>Click the "Sign In" button below</li>
              <li>Enter your email and temporary password exactly as shown above</li>
              <li>You'll be taken to your client dashboard</li>
              <li>Configure your AI assistant's settings</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://welcomeai.io/client/auth" 
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
        
        console.log("Generated HTML template length:", html.length);
      }
      
      // Validate HTML content
      if (!html || html.includes("undefined") || !html.includes("</div>")) {
        throw new Error("Invalid HTML template generated");
      }
      
      // Check if recipient email is valid
      if (!options.to || (typeof options.to === 'string' && !options.to.includes('@')) || 
          (Array.isArray(options.to) && (options.to.length === 0 || !options.to[0].includes('@')))) {
        const error = "Valid recipient email is required";
        console.error(error, { to: options.to });
        return {
          success: false,
          error: error
        };
      }
      
      // Call the edge function directly with the Supabase client
      console.log("Calling send-email edge function...");
      
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: options.to,
          subject: options.subject,
          html: html,
          from: options.from || "Welcome.Chat <admin@welcome.chat>"
        }
      });
      
      if (error) {
        console.error("Error from edge function:", error);
        throw error; // This will trigger a retry
      }
      
      // Validate Edge Function response
      if (!data || typeof data.success !== 'boolean') {
        console.error("Invalid response from edge function:", data);
        throw new Error("Invalid response from email service"); // This will trigger a retry
      }
      
      if (!data.success) {
        console.error("Edge function returned failure:", data);
        throw new Error(data.error || "Edge function reported failure"); // This will trigger a retry
      }
      
      console.log("Email sent successfully:", data);
      return {
        success: true,
        details: data
      };
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries < MAX_RETRIES) {
        console.log(`Email send failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  // If we get here, all retries failed
  console.error(`Failed to send email after ${MAX_RETRIES} attempts. Last error:`, lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to send email after multiple attempts",
    details: lastError
  };
}

/**
 * Sends a welcome email to the client with their credentials
 */
export const sendWelcomeEmail = async (email: string, clientName: string, tempPassword: string) => {
  console.log("Sending welcome email to:", email);
  console.log("Using password:", tempPassword ? `${tempPassword.substring(0, 3)}...` : "No password provided");
  
  if (!email || !email.includes('@')) {
    console.error("Invalid email address provided:", email);
    return {
      emailSent: false,
      emailError: "Invalid email address"
    };
  }
  
  if (!tempPassword) {
    console.error("No temporary password provided");
    return {
      emailSent: false,
      emailError: "No temporary password provided"
    };
  }
  
  const emailResult = await sendEmail({
    to: email,
    subject: "Welcome to Welcome.Chat - Your Account Details",
    template: "client-invitation",
    from: "Welcome.Chat <admin@welcome.chat>",
    params: {
      clientName: clientName || "Client",
      email: email,
      tempPassword: tempPassword,
      productName: "Welcome.Chat"
    }
  });
  
  console.log("Welcome email result:", emailResult);
  
  if (!emailResult.success) {
    console.error("Error sending welcome email:", emailResult.error);
    console.error("Error details:", emailResult.details);
    return {
      emailSent: false,
      emailError: emailResult.error
    };
  }
  
  console.log("Welcome email sent successfully");
  return {
    emailSent: true
  };
};
