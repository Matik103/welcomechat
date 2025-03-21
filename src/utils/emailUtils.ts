import { supabase } from "@/integrations/supabase/client";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  from?: string;
  params?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  error?: string;
}

/**
 * Sends an email using the send-email edge function
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResponse> => {
  try {
    console.log("Starting email send process with options:", {
      to: options.to,
      subject: options.subject,
      template: options.template,
      from: options.from || "default"
    });
    
    const fromAddress = options.from || "Welcome.Chat <admin@welcome.chat>";
    console.log("Using from address:", fromAddress);
    
    let html = options.html || "";
    
    // If template is specified, build the HTML from the template
    if (options.template === "client-invitation") {
      // Use params to populate the template
      const params = options.params || {};
      
      console.log("Building client invitation template with params:", {
        clientName: params.clientName,
        email: params.email,
        hasPassword: !!params.tempPassword,
        productName: params.productName
      });
      
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
    
    if (!html) {
      throw new Error("Email content is required. Provide either 'html' or a valid 'template'.");
    }
    
    // Check if recipient email is valid
    if (!options.to || (typeof options.to === 'string' && !options.to.includes('@')) || 
        (Array.isArray(options.to) && options.to.length === 0)) {
      throw new Error("Valid recipient email is required");
    }
    
    // Call the edge function directly with the Supabase client
    console.log("Calling send-email edge function...");
    
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: options.to,
        subject: options.subject,
        html: html,
        from: fromAddress
      }
    });
    
    if (error) {
      console.error("Error from edge function:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        status: error.status,
        name: error.name,
        details: error.details
      });
      return {
        success: false,
        error: `Edge Function Error: ${error.message}${error.details ? ` (${error.details})` : ''}`
      };
    }
    
    if (!data?.success) {
      console.error("Edge function returned failure:", data);
      return {
        success: false,
        error: data?.error || "Edge function reported failure"
      };
    }
    
    console.log("Email sent successfully:", data);
    return {
      success: true
    };
  } catch (error) {
    console.error("Error in sendEmail:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
      name: error.name,
      stack: error.stack
    });
    return {
      success: false,
      error: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
    };
  }
};

/**
 * Sends a welcome email to the client with their credentials
 */
export const sendWelcomeEmail = async (email: string, clientName: string, tempPassword: string) => {
  console.log("Sending welcome email to:", email);
  
  const emailResult = await sendEmail({
    to: email,
    subject: "Welcome to Welcome.Chat - Your Account Details",
    template: "client-invitation",
    from: "Welcome.Chat <admin@welcome.chat>",
    params: {
      clientName: clientName,
      email: email,
      tempPassword: tempPassword,
      productName: "Welcome.Chat"
    }
  });
  
  console.log("Welcome email result:", emailResult);
  
  if (!emailResult.success) {
    console.error("Error sending welcome email:", emailResult.error);
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
