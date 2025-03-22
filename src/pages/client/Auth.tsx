
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { execSql } from "@/utils/rpcUtils";

const ClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { session, isLoading, userRole } = useAuth();
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [searchParams] = useSearchParams();
  const autoReactivate = searchParams.get("auto_reactivate") === "true";
  const clientId = searchParams.get("client_id");

  // Set a short timeout to prevent infinite loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Show loading state while authentication is being checked
  if (isLoading && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect if already authenticated
  if (session) {
    // If auto reactivate is in the URL, handle account reactivation
    if (autoReactivate && clientId) {
      // Async function to reactivate the account
      const reactivateAccount = async () => {
        try {
          // Use execSql instead of directly calling the clients table
          const reactivateQuery = `
            UPDATE clients 
            SET deletion_scheduled_at = NULL 
            WHERE id = '${clientId}'
          `;
          
          const result = await execSql(reactivateQuery);
            
          if (!result) {
            console.error("Error reactivating account");
            toast.error("Failed to reactivate your account. Please contact support.");
          } else {
            toast.success("Your account has been successfully reactivated!");
          }
        } catch (error) {
          console.error("Error in reactivation process:", error);
          toast.error("An unexpected error occurred. Please contact support.");
        }
      };
      
      // Execute the reactivation
      reactivateAccount();
    }
    
    // Based on user role, redirect to the appropriate dashboard
    if (userRole === 'client') {
      console.log("Redirecting client to client dashboard");
      return <Navigate to="/client/dashboard" replace />;
    } else if (userRole === 'admin') {
      console.log("Redirecting admin to admin dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // If role is not determined yet, wait for it
      console.log("User role not yet determined, showing loading");
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      );
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent multiple clicks while processing
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // If auto reactivate is in the URL, we'll handle it after redirect
      if (!autoReactivate) {
        toast.success("Successfully signed in!");
      } else {
        toast.success("Successfully signed in! Reactivating your account...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      // Ensure loading state is cleared even if there's an error
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {autoReactivate ? "Recover your account" : "Sign in to your account"}
          </CardTitle>
          <CardDescription>
            {autoReactivate 
              ? "Enter your credentials to reactivate your account" 
              : "Enter your credentials to access your AI agent dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="m@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              aria-label={autoReactivate ? "Recover Account" : "Sign In"}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                autoReactivate ? "Recover Account" : "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAuth;
