
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is";

// Initialize Supabase client
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

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailSending() {
  console.log("Starting email test with enhanced debugging...");
  console.log("Resend API Key status:", process.env.RESEND_API_KEY ? "✓ Available" : "✗ Missing");
  
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
      console.log("Proceeding with direct Resend test anyway...");
    } else {
      console.log("Environment check before sending:", envData);
    }

    // Now test email sending directly with Resend
    console.log("Testing direct Resend email sending...");

    const testEmail = "delivered@resend.dev"; // Resend's test recipient email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Welcome.Chat <admin@welcome.chat>",
      to: testEmail,
      subject: "Test Email - Direct Resend API Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4f46e5;">Welcome.Chat Test Email</h1>
          </div>
          
          <p>Hello Test User,</p>
          
          <p>This is a test email sent directly using the Resend API to verify the email sending functionality is working correctly.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Test Details:</strong></p>
            <ul style="list-style-type: none; padding: 0;">
              <li>Time: ${new Date().toLocaleString()}</li>
              <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
              <li>Service: Resend.com Direct API</li>
            </ul>
          </div>
          
          <p>If you received this email, it means the direct Resend email sending functionality is working properly.</p>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} Welcome.Chat - Test Email
          </div>
        </div>
      `
    });

    if (emailError) {
      console.error("Direct Resend email test failed:", emailError);
      throw emailError;
    }

    console.log("Direct Resend email test completed successfully:", emailData);
    console.log("Email ID:", emailData.id);
    console.log("If the email was sent successfully, you should receive it at the test email address.");
    
    return {
      success: true,
      emailId: emailData.id
    };
  } catch (error) {
    console.error("Test failed with error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run the test
testEmailSending().then(result => {
  console.log("Test completed with result:", result);
  if (result.success) {
    console.log("✅ Email functionality test passed!");
    process.exit(0);
  } else {
    console.error("❌ Email functionality test failed!");
    process.exit(1);
  }
}).catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
