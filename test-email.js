
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'welcomechat_auth_token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false
  }
});

async function testEmailSending() {
  console.log("Starting email test with enhanced debugging...");
  
  try {
    // First test Supabase connection
    console.log("Testing Supabase connection...");
    const { data: testData, error: testError } = await supabase.from('ai_agents').select('count').limit(1);
    
    if (testError) {
      console.error("Supabase connection test failed:", testError);
    } else {
      console.log("Supabase connection test successful");
    }

    // Check Resend API key configuration
    console.log("Checking environment configuration...");
    const { data: envData, error: envError } = await supabase.functions.invoke("test-env", {
      body: {}
    });
    
    if (envError) {
      console.error("Error checking environment configuration:", envError);
      throw new Error("Failed to check environment configuration");
    }

    if (!envData?.hasResendKey) {
      console.error("Resend API key is not configured");
      throw new Error("Email service not configured: Missing Resend API key");
    }

    console.log("Environment check before sending:", envData);

    // Now test email sending
    console.log("Testing email sending with enhanced logging...");

    const testEmail = "stephen@soprisapps.com"; // Using the sender email as the test recipient
    const { data: emailData, error: emailError } = await supabase.functions.invoke("send-email", {
      body: {
        to: testEmail,
        subject: "Test Email - Enhanced Validation",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4f46e5;">Welcome.Chat Test Email</h1>
            </div>
            
            <p>Hello Test User,</p>
            
            <p>This is a test email to verify the email sending functionality is working correctly.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Test Details:</strong></p>
              <ul style="list-style-type: none; padding: 0;">
                <li>Time: ${new Date().toLocaleString()}</li>
                <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
                <li>Service: Resend.com</li>
              </ul>
            </div>
            
            <p>If you received this email, it means the email sending functionality is working properly.</p>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Welcome.Chat - Test Email
            </div>
          </div>
        `
      }
    });

    if (emailError) {
      console.error("Email test failed with error:", emailError);
      if (emailError instanceof Error) {
        console.error("Error details:", {
          message: emailError.message,
          name: emailError.name,
          stack: emailError.stack
        });
      }

      // Try to get the response body for more details
      if (emailError.context?.body) {
        try {
          const responseBody = await emailError.context.body.text();
          console.error("Error response body:", responseBody);
        } catch (e) {
          console.error("Failed to read error response body:", e);
        }
      }

      throw emailError;
    }

    console.log("Email test completed successfully:", emailData);
  } catch (error) {
    console.error("Test failed with error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
}

// Run the test
testEmailSending().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
