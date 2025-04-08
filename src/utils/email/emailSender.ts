
import { supabase } from '@/integrations/supabase/client';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  error?: string;
  details?: any;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 800; // 800ms

/**
 * Validates an email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sends an email using the Supabase Edge Function
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  let retries = 0;
  let lastError: any = null;

  // Validate email format before sending
  const emails = Array.isArray(options.to) ? options.to : [options.to];
  const invalidEmails = emails.filter(email => !isValidEmail(email));
  
  if (invalidEmails.length > 0) {
    const error = `Invalid email format: ${invalidEmails.join(', ')}`;
    console.error(error);
    return {
      success: false,
      error,
      details: { invalidEmails }
    };
  }

  while (retries <= MAX_RETRIES) {
    try {
      console.log(`Attempt ${retries + 1} of ${MAX_RETRIES + 1} to send email to: ${options.to}`);
      
      // Validate required fields
      if (!options.to || !options.subject || !options.html) {
        const missingFields = [];
        if (!options.to) missingFields.push('to');
        if (!options.subject) missingFields.push('subject');
        if (!options.html) missingFields.push('html');
        
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: options.to,
          subject: options.subject,
          html: options.html,
          from: options.from
        },
        // Add a timeout to prevent hanging requests
        responseType: 'json'
      });
      
      if (error) {
        console.error("Error from send-email function:", error);
        throw error;
      }
      
      if (!data || !data.success) {
        console.error("Email service returned error:", data?.error || "Unknown error");
        throw new Error(data?.error || "Unknown error from email service");
      }
      
      console.log("Email sent successfully:", data);
      return {
        success: true,
        details: data
      };
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${retries + 1} failed:`, error);
      retries++;
      
      if (retries <= MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  // If we get here, all retries failed
  console.error(`Failed to send email after ${MAX_RETRIES + 1} attempts. Last error:`, lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to send email after multiple attempts",
    details: lastError
  };
}
