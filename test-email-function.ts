
// This is a script to test the send-welcome-email function
// Run with: npx ts-node test-email-function.ts

import { supabase } from "./src/integrations/supabase/client";

interface EmailTestResult {
  success: boolean;
  id?: string;
  error?: string;
  details?: any;
}

async function testWelcomeEmail() {
  console.log("=".repeat(80));
  console.log("WELCOME EMAIL TEST UTILITY");
  console.log("=".repeat(80));
  
  // First test Supabase connection
  console.log("\n[1/5] Testing Supabase connection...");
  
  try {
    const { data: testData, error: testError } = await supabase.from('ai_agents').select('count').limit(1);
    
    if (testError) {
      console.error("❌ Supabase connection test failed:", testError);
    } else {
      console.log("✅ Supabase connection test successful");
    }
  } catch (error) {
    console.error("❌ Supabase connection error:", error);
  }

  // Check for Resend API key in environment
  console.log("\n[2/5] Checking environment configuration...");
  
  try {
    const { data: envData, error: envError } = await supabase.functions.invoke(
      "test-env", 
      { body: {} }
    );
    
    if (envError) {
      console.error("❌ Error checking environment configuration:", envError);
    } else if (envData?.hasResendKey) {
      console.log("✅ Resend API key is configured in Supabase environment");
      console.log(`   Key format: ${envData.resendKeyFormat || 'unknown'}`);
    } else {
      console.error("❌ Resend API key is NOT configured in Supabase environment");
      console.log("   Please set the RESEND_API_KEY environment variable in your Supabase project");
    }
    
    if (envData) {
      console.log("   Environment check details:", envData);
    }
  } catch (error) {
    console.error("❌ Environment check failed:", error);
  }

  // Configure test data - use YOUR email to receive the test
  const testEmail = "your-email@example.com"; // REPLACE WITH YOUR EMAIL
  
  const testData = {
    clientId: "test-client-id",
    clientName: "Test Client",
    email: testEmail,
    agentName: "Test AI Assistant",
    tempPassword: "Welcome2024#123"
  };
  
  console.log("\n[3/5] Test data configuration:");
  console.log("   Client ID:", testData.clientId);
  console.log("   Client Name:", testData.clientName);
  console.log("   Email:", testData.email);
  console.log("   Agent Name:", testData.agentName);
  console.log("   Temp Password:", testData.tempPassword);
  
  if (testEmail === "your-email@example.com") {
    console.warn("⚠️  Warning: You are using the placeholder email address.");
    console.warn("   Please edit this file and replace it with your actual email to receive the test.");
  }
  
  // Test using the send-email function directly
  console.log("\n[4/5] Testing generic send-email function...");
  
  try {
    const { data: directEmailData, error: directEmailError } = await supabase.functions.invoke(
      "send-email",
      {
        body: {
          to: testEmail,
          subject: "Test Email from Welcome.Chat",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #4f46e5;">Welcome.Chat Test Email</h1>
              </div>
              
              <p>Hello Test User,</p>
              
              <p>This is a test email sent at ${new Date().toLocaleString()}</p>
              
              <p>If you received this email, your email sending is working correctly.</p>
              
              <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Welcome.Chat - Test Email
              </div>
            </div>
          `,
          from: "Welcome.Chat <admin@welcome.chat>"
        }
      }
    );
    
    if (directEmailError) {
      console.error("❌ Direct email test failed:", directEmailError);
    } else if (directEmailData?.success) {
      console.log("✅ Direct email test successful!");
      console.log("   Email ID:", directEmailData.data?.id);
    } else {
      console.error("❌ Direct email test failed:", directEmailData?.error || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Direct email test error:", error);
  }
  
  // Now test the welcome email function
  console.log("\n[5/5] Testing welcome email function...");
  
  try {
    const { data, error } = await supabase.functions.invoke(
      'send-welcome-email',
      {
        body: testData
      }
    );
    
    if (error) {
      console.error("❌ Welcome email function error:", error);
      return;
    }
    
    if (data?.success) {
      console.log("✅ Welcome email sent successfully!");
      console.log("   Email ID:", data.data?.id);
      
      // Show instructions for checking email
      console.log("\n[SUCCESS] Test completed successfully");
      console.log(`Check ${testEmail} inbox for the test emails`);
      console.log("If you don't see them:");
      console.log("1. Check your spam folder");
      console.log("2. Verify the Resend API key is correct");
      console.log("3. Confirm your email domain is verified in Resend");
    } else {
      console.error("❌ Welcome email function failed:", data?.error || "Unknown error");
      console.error("   Details:", data?.details || "No details available");
    }
  } catch (err) {
    console.error("❌ Error invoking welcome email function:", err);
  }
  
  console.log("\n=".repeat(80));
}

// Run the test
testWelcomeEmail().catch(error => {
  console.error("Unhandled error:", error);
}).finally(() => {
  console.log("Test execution completed");
});
