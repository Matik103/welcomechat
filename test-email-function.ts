
// This is a script to test the send-welcome-email function
// Run with: npx ts-node test-email-function.ts

import { supabase } from "./src/integrations/supabase/client";

async function testWelcomeEmail() {
  console.log("Testing welcome email function...");
  
  const testData = {
    clientId: "test-client-id",
    clientName: "Test Client",
    email: "your-test-email@example.com", // Replace with your email
    agentName: "Test AI Assistant",
    tempPassword: "Welcome2024#123"
  };
  
  console.log("Sending test email with data:", testData);
  
  try {
    const { data, error } = await supabase.functions.invoke(
      'send-welcome-email',
      {
        body: testData
      }
    );
    
    if (error) {
      console.error("Function error:", error);
      return;
    }
    
    console.log("Function response:", data);
  } catch (err) {
    console.error("Error invoking function:", err);
  }
}

testWelcomeEmail();
