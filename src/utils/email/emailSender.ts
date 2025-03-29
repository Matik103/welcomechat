
import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
// Check if we're in a browser environment and use the appropriate variable
const resendApiKey = typeof window !== 'undefined' 
  ? import.meta.env.VITE_RESEND_API_KEY 
  : process.env.RESEND_API_KEY;

// Initialize Resend client with proper error handling
let resend: Resend;
try {
  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not defined. Email functionality will not work.");
  }
  resend = new Resend(resendApiKey || 'dummy_key_for_initialization');
} catch (error) {
  console.error("Failed to initialize Resend client:", error);
  // Create a mock Resend instance to prevent runtime errors
  resend = {
    emails: {
      send: async () => ({ data: null, error: new Error("Resend client not properly initialized") })
    }
  } as unknown as Resend;
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

export interface EmailResponse {
  success: boolean;
  error?: string;
  details?: any;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sends an email using Resend
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
      
      // Send email directly using Resend
      console.log("Sending email via Resend...");
      
      const { data, error } = await resend.emails.send({
        from: options.from || 'Welcome.Chat <admin@welcome.chat>',
        to: options.to,
        subject: options.subject,
        html: html
      });
      
      if (error) {
        console.error("Error from Resend:", error);
        throw error; // This will trigger a retry
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

// Export the initialized Resend instance for direct use in tests
export { resend };
