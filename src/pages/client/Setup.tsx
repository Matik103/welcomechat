
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientActivity } from "@/hooks/useClientActivity";
import SetupForm from "@/components/client-setup/SetupForm";
import { createClientAccount } from "@/utils/setupUtils";
import { toast } from "sonner";

const ClientSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for form
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  // Extract client ID from URL
  const query = new URLSearchParams(location.search);
  const clientId = query.get("id");
  
  // Initialize client activity logging
  const { logClientActivity } = useClientActivity(clientId);

  // Check if there's an access token in the URL (from password reset link)
  useEffect(() => {
    const checkAccessToken = async () => {
      console.log("Checking for access token in URL...");
      const fragment = location.hash;
      
      if (fragment && fragment.includes("access_token")) {
        console.log("Found access token in URL, processing authentication");
        const params = new URLSearchParams(fragment.substring(1));
        const accessToken = params.get("access_token");
        
        if (accessToken) {
          try {
            console.log("Setting session with access token");
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get("refresh_token") || "",
            });
            
            if (error) {
              console.error("Error setting session:", error);
              toast.error("Authentication failed. Please try again.");
            } else {
              console.log("Session set successfully");
              
              // After setting the session, redirect to client dashboard
              // Add short delay to ensure session is processed
              setTimeout(() => {
                navigate("/client/view", { replace: true });
              }, 500);
            }
          } catch (err) {
            console.error("Error processing authentication:", err);
            toast.error("Authentication failed. Please try again.");
          }
        }
      }
      
      setIsVerifying(false);
    };
    
    checkAccessToken();
  }, [location, navigate]);

  // Check if the user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      console.log("Checking for existing session...");
      const { data } = await supabase.auth.getSession();
      if (data.session && !clientId) {
        console.log("User already logged in, redirecting to client dashboard");
        // If user is already logged in and not in the setup process, redirect to client dashboard
        navigate("/client/view", { replace: true });
      }
      setIsVerifying(false);
    };
    
    if (!isVerifying) {
      checkSession();
    }
  }, [navigate, clientId, isVerifying]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error("Missing client information. Please use the link from your invitation email.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating client account for client ID:", clientId);
      await createClientAccount(clientId, password, confirmPassword, logClientActivity);
      
      setSetupComplete(true);
      
      // Force a longer delay to ensure auth state updates completely
      setTimeout(() => {
        // Explicitly redirect to client dashboard after successful setup and sign in
        navigate("/client/view", { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Failed to set up account: " + (error.message || String(error)));
      setIsLoading(false);
    }
  };

  // Show loading state while we're verifying authentication
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SetupForm
      isLoading={isLoading}
      setupComplete={setupComplete}
      password={password}
      confirmPassword={confirmPassword}
      setPassword={setPassword}
      setConfirmPassword={setConfirmPassword}
      handleSubmit={handleSubmit}
    />
  );
};

export default ClientSetup;
