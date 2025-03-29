import { Resend } from 'resend';

// Initialize Resend using import.meta.env instead of process.env
// This works in Vite applications which run in the browser
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

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

/**
 * Sends an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    console.log("Sending email with options:", {
      to: options.to,
      subject: options.subject,
      hasHtml: !!options.html,
      template: options.template,
      hasParams: !!options.params,
      from: options.from || "default"
    });

    let html = options.html || "";

    // If a template is specified, generate the HTML content
    if (options.template === "client-invitation") {
      const params = options.params || {};
      
      if (!params.clientName || !params.email || !params.tempPassword) {
        throw new Error("Missing required parameters for client invitation template");
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
            <p>For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
          </div>
          
          <p>Best regards,<br>The ${params.productName || 'Welcome.Chat'} Team</p>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} ${params.productName || 'Welcome.Chat'}. All rights reserved.
          </div>
        </div>
      `;
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

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: options.from || 'WelcomeChat <admin@welcome.chat>',
      to: options.to,
      subject: options.subject,
      html: html
    });

    if (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log("Email sent successfully:", data);
    return {
      success: true,
      details: data
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: error
    };
  }
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

/**
 * Sends a deletion notification email to the client with recovery instructions
 */
export const sendDeletionEmail = async (
  email: string, 
  clientName: string, 
  recoveryToken: string,
  deletionDate: string
): Promise<{ emailSent: boolean; emailError?: string }> => {
  console.log("Sending deletion notification email to:", email);
  
  if (!email || !email.includes('@')) {
    console.error("Invalid email address provided:", email);
    return {
      emailSent: false,
      emailError: "Invalid email address"
    };
  }
  
  if (!recoveryToken) {
    console.error("No recovery token provided");
    return {
      emailSent: false,
      emailError: "No recovery token provided"
    };
  }
  
  const formattedDeletionDate = new Date(deletionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const recoveryUrl = `${window.location.origin}/client/auth?recovery=${recoveryToken}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'WelcomeChat <admin@welcome.chat>',
      to: email,
      subject: "Important: Your Account is Scheduled for Deletion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff4a4a;">Account Scheduled for Deletion</h1>
          </div>
          
          <p>Hello ${clientName || 'Client'},</p>
          
          <p>Your account has been scheduled for deletion. All your data will be <strong>permanently removed</strong> on ${formattedDeletionDate}.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>If this was a mistake</strong>, you can recover your account by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${recoveryUrl}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Recover My Account
              </a>
            </div>
            
            <p>This recovery link will expire on ${formattedDeletionDate}.</p>
          </div>
          
          <p>If you intended to delete your account, no further action is required. Your data will be automatically removed after the deletion date.</p>
          
          <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px;">
            <p><strong>What gets deleted?</strong></p>
            <ul style="margin-top: 5px;">
              <li>All website URLs and content</li>
              <li>All document links and content</li>
              <li>Chat history and interactions</li>
              <li>Account settings and configurations</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Welcome.Chat Team</p>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} Welcome.Chat. All rights reserved.
          </div>
        </div>
      `
    });
    
    if (error) {
      console.error("Error sending deletion notification email:", error);
      return {
        emailSent: false,
        emailError: error.message
      };
    }
    
    console.log("Deletion notification email sent successfully:", data);
    return {
      emailSent: true
    };
  } catch (error) {
    console.error("Error sending deletion notification email:", error);
    return {
      emailSent: false,
      emailError: error instanceof Error ? error.message : String(error)
    };
  }
};
