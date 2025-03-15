
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientActivity } from "@/hooks/useClientActivity";
import SetupForm from "@/components/client-setup/SetupForm";
import { createClientAccount } from "@/utils/setupUtils";

const ClientSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for form
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);
  
  // Extract client ID from URL
  const query = new URLSearchParams(location.search);
  const clientId = query.get("id");
  
  // Initialize client activity logging with fixed parameter
  const { logClientActivity } = useClientActivity(clientId || "");

  // Check if the user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && !clientId) {
        console.log("User already logged in, redirecting to client dashboard");
        // If user is already logged in and not in the setup process, redirect to client dashboard
        navigate("/client/dashboard", { replace: true });
      }
    };
    
    checkSession();
  }, [navigate, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      console.error("No client ID provided");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createClientAccount(clientId, password, confirmPassword, logClientActivity);
      
      setSetupComplete(true);
      
      // Force a longer delay to ensure auth state updates completely
      setTimeout(() => {
        // Explicitly redirect to client dashboard after successful setup and sign in
        navigate("/client/dashboard", { replace: true });
      }, 1500);
      
    } catch (error) {
      setIsLoading(false);
    }
  };

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
