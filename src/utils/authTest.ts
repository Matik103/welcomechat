
import { supabase } from "@/integrations/supabase/client";
import { determineUserRole } from "@/utils/authUtils";

/**
 * Test function to verify auth setup
 * Run this from the browser console with: 
 * import('@/utils/authTest').then(mod => mod.testAuth())
 */
export const testAuth = async (): Promise<void> => {
  console.log("🔍 Starting auth setup verification test...");
  
  try {
    // Step 1: Check current session
    console.log("Step 1: Checking current auth session...");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      return;
    }
    
    console.log("✅ Session check complete:", sessionData.session ? "User is logged in" : "No active session");
    
    // Step 2: Verify user if logged in
    if (sessionData.session) {
      console.log("Step 2: Verifying logged in user...");
      const user = sessionData.session.user;
      console.log("📝 User details:", {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        last_sign_in: user.last_sign_in_at
      });
      
      // Step 3: Test role determination
      console.log("Step 3: Testing role determination...");
      try {
        const role = await determineUserRole(user);
        console.log("✅ User role determined:", role);
        
        // Step 4: Check if client exists in DB
        if (user.email) {
          console.log("Step 4: Checking if user exists in clients table...");
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, client_name')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();
            
          if (clientError) {
            console.error("❌ Client lookup error:", clientError);
          } else {
            console.log("✅ Client lookup result:", clientData ? `Found client: ${clientData.client_name}` : "Not in clients table");
          }
        }
      } catch (roleError) {
        console.error("❌ Role determination failed:", roleError);
      }
    } else {
      console.log("🔍 No active session, skipping user verification");
    }
    
    // Step 5: Test client deletion verification
    console.log("Step 5: Verifying client removal for stephen@soprisapps.com...");
    const { data: checkClient, error: checkError } = await supabase
      .from('clients')
      .select('id, client_name')
      .eq('email', 'stephen@soprisapps.com')
      .maybeSingle();
      
    if (checkError) {
      console.error("❌ Check error:", checkError);
    } else {
      if (checkClient) {
        console.error("❌ Client still exists in database:", checkClient);
      } else {
        console.log("✅ Client was successfully removed from database");
      }
    }
    
    console.log("✅ Auth setup verification test completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};
