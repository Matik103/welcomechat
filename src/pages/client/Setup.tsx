
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TokenData {
  clientId: string;
  email: string;
  clientName: string;
  isValid: boolean;
}

const ClientSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  // Extract token from URL
  const query = new URLSearchParams(location.search);
  const token = query.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast.error("Invalid or missing invitation token");
        navigate("/auth");
        return;
      }

      try {
        setIsLoading(true);
        
        // Check if token exists and is valid
        const { data: invitation, error } = await supabase
          .from("client_invitations")
          .select("client_id, email, expires_at, status")
          .eq("token", token)
          .single();

        if (error || !invitation) {
          toast.error("Invalid or expired invitation token");
          navigate("/auth");
          return;
        }

        // Check if token is expired
        if (new Date(invitation.expires_at) < new Date() || invitation.status !== "pending") {
          toast.error("This invitation has expired or already been used");
          navigate("/auth");
          return;
        }

        // Get client information
        const { data: client } = await supabase
          .from("clients")
          .select("client_name")
          .eq("id", invitation.client_id)
          .single();

        setTokenData({
          clientId: invitation.client_id,
          email: invitation.email,
          clientName: client?.client_name || "Your Company",
          isValid: true
        });
      } catch (error) {
        console.error("Error verifying token:", error);
        toast.error("There was a problem verifying your invitation");
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenData?.isValid) {
      toast.error("Invalid invitation");
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
      setIsSubmitting(true);

      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tokenData.email,
        password: password,
      });

      if (signUpError) throw signUpError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({ 
          status: "accepted", 
          accepted_at: new Date().toISOString() 
        })
        .eq("token", token);

      if (updateError) throw updateError;

      // Create user role for the client
      await supabase.from("user_roles").insert({
        user_id: signUpData.user!.id,
        role: "client"
      });

      toast.success("Account created successfully! Redirecting to dashboard...");
      
      // Login with the new credentials
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: tokenData.email,
        password: password
      });
      
      if (loginError) throw loginError;
      
      // Allow time for toast to be seen
      setTimeout(() => {
        navigate("/client/view");
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up account:", error);
      toast.error(error.message || "Failed to set up your account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (!tokenData?.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-4">This invitation link is invalid or has expired.</p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Setup</CardTitle>
          <CardDescription>
            Create your password to access the {tokenData.clientName} AI Assistant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={tokenData.email} disabled />
            </div>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
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
