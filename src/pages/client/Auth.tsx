
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { execSql } from "@/utils/rpcUtils";

const ClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { user, isLoading, userRole } = useAuth();
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
  if (user) {
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
    setErrorMessage("");

    try {
      console.log("Attempting to sign in with email:", email);
      
      // Add detailed logging for authentication debugging
      console.log("Sign-in credentials:", { 
        email, 
        passwordLength: password.length,
        passwordContainsSpecial: /[!@#$%^&*]/.test(password),
        passwordContainsUpper: /[A-Z]/.test(password),
        passwordContainsLower: /[a-z]/.test(password),
        passwordContainsNumber: /[0-9]/.test(password)
      });
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        
        if (error.message?.includes("Invalid login credentials")) {
          // Provide more helpful error message for authentication issues
          setErrorMessage("Invalid email or password. Please make sure you're using the exact password from the welcome email.");
          
          // Try to check if this user exists and if they have a temporary password
          try {
            const { data: tempPasswords, error: tempPasswordError } = await supabase
              .from('client_temp_passwords')
              .select('temp_password, created_at')
              .eq('email', email)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (tempPasswordError) {
              console.error("Error checking temp passwords:", tempPasswordError);
            } else if (tempPasswords && tempPasswords.length > 0) {
              const tempPassword = tempPasswords[0];
              
              // Check if the provided password matches the temp password
              if (password !== tempPassword.temp_password) {
                setErrorMessage("The password you entered doesn't match our records. Please use the exact password from the welcome email.");
              }
              
              // Log the temp password for debugging
              console.log("Found temp password record:", {
                storedPassword: tempPassword.temp_password,
                passwordMatch: password === tempPassword.temp_password,
                createdAt: tempPassword.created_at
              });
              
              // Double-check if the password meets Supabase requirements
              console.log("Password requirements check:", {
                meetsLengthRequirement: password.length >= 8,
                hasUppercase: /[A-Z]/.test(password),
                hasLowercase: /[a-z]/.test(password),
                hasNumber: /[0-9]/.test(password),
                hasSpecial: /[!@#$%^&*]/.test(password)
              });
            } else {
              console.log("No temporary password found for email:", email);
            }
          } catch (tempCheckError) {
            console.error("Error checking temporary password:", tempCheckError);
          }
        } else {
          setErrorMessage(error.message || "Failed to sign in");
        }
        
        toast.error(errorMessage || "Authentication failed");
      } else {
        console.log("Sign in successful:", authData);
        
        // If auto reactivate is in the URL, we'll handle it after redirect
        if (!autoReactivate) {
          toast.success("Successfully signed in!");
        } else {
          toast.success("Successfully signed in! Reactivating your account...");
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast.error("Authentication failed");
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
            
            {errorMessage && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              aria-label={autoReactivate ? "Recover Account" : "Sign In"}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {loading ? "Signing in..." : autoReactivate ? "Recover Account" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAuth;
