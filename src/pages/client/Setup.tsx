
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
  const token = query.get("token");

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
    
    if (!clientId && !token) {
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
      
      // Determine if this is a token-based recovery or direct client ID setup
      if (token) {
        // Verify the recovery token
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
          "verify-recovery-token",
          { body: { token } }
        );
        
        if (tokenError || !tokenData) {
          throw new Error(tokenError?.message || "Invalid recovery token");
        }
        
        // Use the clientId from token verification
        const recoveryClientId = tokenData.clientId;
        
        // Create user account with client's email
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tokenData.email,
          password: password,
        });
        
        if (signUpError) throw signUpError;
        
        // Create user role mapping for the new user
        if (signUpData.user) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: signUpData.user.id,
              role: "client",
              client_id: recoveryClientId
            });
            
          if (roleError) throw roleError;
          
          // Set client ID in user metadata
          const { error: metadataError } = await supabase.auth.updateUser({
            data: { client_id: recoveryClientId }
          });
          
          if (metadataError) throw metadataError;
        }
      } else {
        // Use the clientId from the URL directly
        // Fetch client email from client ID
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("email, client_name")
          .eq("id", clientId)
          .single();
          
        if (clientError || !clientData) {
          throw new Error("Could not find client information");
        }
        
        // Create user account with client's email
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: clientData.email,
          password: password,
        });

        if (signUpError) throw signUpError;
        
        // Create user role mapping for the new user
        if (signUpData.user) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: signUpData.user.id,
              role: "client",
              client_id: clientId
            });
            
          if (roleError) throw roleError;
          
          // Set client ID in user metadata
          const { error: metadataError } = await supabase.auth.updateUser({
            data: { client_id: clientId }
          });
          
          if (metadataError) throw metadataError;
        }
      }

      setSetupComplete(true);
      toast.success("Account setup successful! Signing you in...");
      
      // Sign in with the new credentials - will redirect to client dashboard after sign in
      if (token) {
        // For token-based setup, get the email from token verification first
        const { data: tokenData } = await supabase.functions.invoke(
          "verify-recovery-token",
          { body: { token } }
        );
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: tokenData.email,
          password: password,
        });
        
        if (signInError) throw signInError;
      } else {
        // Regular setup with client ID
        const { data: clientData } = await supabase
          .from("clients")
          .select("email")
          .eq("id", clientId)
          .single();
          
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: clientData.email,
          password: password,
        });
        
        if (signInError) throw signInError;
      }
      
      console.log("Setup complete, redirecting to client dashboard");
      // Explicitly redirect to client dashboard after successful setup and sign in
      navigate("/client/view", { replace: true });
      
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
