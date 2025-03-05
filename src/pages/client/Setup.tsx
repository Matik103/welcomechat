
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientActivity } from "@/hooks/useClientActivity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createClientAccount } from "@/utils/setupUtils";

const ClientSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Extract client ID from URL
  const query = new URLSearchParams(location.search);
  const clientId = query.get("id");
  
  // Initialize client activity logging
  const { logClientActivity } = useClientActivity(clientId);

  useEffect(() => {
    // Check if the user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session && !clientId) {
        console.log("User already logged in, redirecting to client dashboard");
        navigate("/client/view", { replace: true });
        return;
      }
      
      // If we have a client ID, auto-create the account
      if (clientId) {
        try {
          await createClientAccount(clientId, logClientActivity);
          setSetupStatus("success");
        } catch (error: any) {
          console.error("Setup error:", error);
          setSetupStatus("error");
          setErrorMessage(error.message || "Failed to set up your account");
        } finally {
          setIsLoading(false);
        }
      } else {
        setSetupStatus("error");
        setErrorMessage("Invalid setup link. Please contact support.");
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [navigate, clientId, logClientActivity]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Account Setup</CardTitle>
          <CardDescription>
            {isLoading 
              ? "Setting up your account..." 
              : setupStatus === "success" 
                ? "Your account has been successfully set up!" 
                : "There was a problem setting up your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-center text-gray-600">
                  Please wait while we set up your account...
                </p>
              </div>
            ) : setupStatus === "success" ? (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    We've sent you an email with login information. Please check your inbox and follow the instructions to access your dashboard.
                  </p>
                  <p className="text-gray-600 font-medium">
                    After your first login, please remember to set up a secure password.
                  </p>
                  <Button 
                    onClick={() => navigate("/client/auth", { replace: true })}
                    className="mt-4"
                  >
                    Go to Login Page
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-center text-red-600 mb-4">
                  {errorMessage}
                </p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetup;
