
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientActivity } from "@/hooks/useClientActivity";

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
  
  // Initialize client activity logging
  const { logClientActivity } = useClientActivity(clientId);

  // Check if the user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("User already logged in, redirecting to client dashboard");
        // If user is already logged in, redirect to client dashboard
        navigate("/client/view", { replace: true });
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error("Invalid setup link");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Starting account setup process");
      
      // Fetch client email from client ID
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("email, client_name")
        .eq("id", clientId)
        .single();
        
      if (clientError || !clientData) {
        console.error("Client lookup error:", clientError);
        throw new Error("Could not find client information");
      }
      
      console.log("Found client:", clientData.email);
      
      // Create user account with client's email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: clientData.email,
        password: password,
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }
      
      console.log("Account created successfully");
      
      // Create user role mapping for the new user
      if (signUpData.user) {
        console.log("Creating user role mapping");
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: signUpData.user.id,
            role: "client",
            client_id: clientId
          });
          
        if (roleError) {
          console.error("Role mapping error:", roleError);
          throw roleError;
        }
        
        // Set client ID in user metadata
        console.log("Setting client metadata");
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { client_id: clientId }
        });
        
        if (metadataError) {
          console.error("Metadata update error:", metadataError);
          throw metadataError;
        }
      }

      setSetupComplete(true);
      toast.success("Account setup successful! Signing you in...");
      
      // Log this activity
      await logClientActivity(
        "client_updated", 
        "completed account setup",
        { setup_method: "invitation" }
      );
      
      // Sign in with the new credentials
      console.log("Signing in with new credentials");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: clientData.email,
        password: password,
      });
      
      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }
      
      console.log("Setup complete and signed in, redirecting to client dashboard");
      
      // Force a short delay to ensure auth state updates
      setTimeout(() => {
        // Explicitly redirect to client dashboard after successful setup and sign in
        navigate("/client/view", { replace: true });
      }, 1000);
      
    } catch (error: any) {
      console.error("Error setting up account:", error);
      toast.error(error.message || "Failed to set up your account");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Setup</CardTitle>
          <CardDescription>
            Create a password to access your AI Assistant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetup;
