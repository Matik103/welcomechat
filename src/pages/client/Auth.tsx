
import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { execSql } from "@/utils/rpcUtils";

const ClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { user, isLoading, userRole } = useAuth();
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [searchParams] = useSearchParams();
  const autoReactivate = searchParams.get("auto_reactivate") === "true";
  const clientId = searchParams.get("client_id");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  if (isLoading && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
    if (autoReactivate && clientId) {
      const reactivateAccount = async () => {
        try {
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
      
      reactivateAccount();
    }
    
    if (userRole === 'client') {
      console.log("Redirecting client to client dashboard");
      return <Navigate to="/client/dashboard" replace />;
    } else if (userRole === 'admin') {
      console.log("Redirecting admin to admin dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    } else {
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
    
    if (loading) return;
    
    setLoading(true);
    setErrorMessage("");

    try {
      console.log("Attempting to sign in with email:", email);
      
      // Check if there's a temporary password for this email before attempting login
      try {
        console.log("Checking for stored temporary password");
        const { data: tempPasswords, error: tempPasswordError } = await supabase
          .from('client_temp_passwords')
          .select('temp_password, created_at')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (tempPasswordError) {
          console.error("Error checking temp passwords:", tempPasswordError);
        } 
        else if (tempPasswords && tempPasswords.length > 0) {
          const storedTempPassword = tempPasswords[0].temp_password;
          
          console.log("Found stored temp password with format:", 
            storedTempPassword ? 
            `${storedTempPassword.substring(0, 7)}...${storedTempPassword.substring(storedTempPassword.length - 4)}` : 
            "none");
        } else {
          console.log("No temporary password found in database for:", email);
        }
      } catch (checkError) {
        console.error("Exception checking temp password:", checkError);
      }
      
      // Try to sign in
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        
        if (error.message?.includes("Invalid login credentials")) {
          // Check if there's a temporary password for this email
          try {
            console.log("Login failed, checking stored temporary password");
            const { data: tempPasswords, error: tempPasswordError } = await supabase
              .from('client_temp_passwords')
              .select('temp_password, created_at')
              .eq('email', email)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (tempPasswordError) {
              console.error("Error checking temp passwords:", tempPasswordError);
              setErrorMessage("Invalid email or password. Please make sure you're using the exact password from the welcome email.");
            } 
            else if (tempPasswords && tempPasswords.length > 0) {
              const tempPassword = tempPasswords[0];
              
              // Check if we have the necessary data before accessing properties
              console.log("Found temp password record:", {
                hasData: !!tempPasswords,
                recordCount: tempPasswords.length,
                passwordMatch: tempPassword && password === tempPassword.temp_password,
                passwordLength: password.length,
                storedPasswordLength: tempPassword?.temp_password?.length,
                // Show partial password for debugging (not showing full for security)
                storedPasswordStart: tempPassword?.temp_password ? tempPassword.temp_password.substring(0, 7) : "N/A",
                storedPasswordEnd: tempPassword?.temp_password ? 
                  tempPassword.temp_password.substring(tempPassword.temp_password.length - 4) : "N/A",
                userPasswordStart: password.substring(0, 7),
                userPasswordEnd: password.length > 4 ? password.substring(password.length - 4) : ''
              });
              
              // Check if passwords match
              if (tempPassword && password !== tempPassword.temp_password) {
                // Provide a detailed error message
                const currentYear = new Date().getFullYear();
                setErrorMessage(
                  `The password you entered doesn't match. Please use the exact password from the welcome email (format: Welcome${currentYear}#XXX).`
                );
                
                // Try calling the user creation endpoint again to ensure user exists
                try {
                  const { data, error } = await supabase.functions.invoke(
                    'create-client-user',
                    {
                      body: {
                        email: email,
                        client_id: tempPassword?.agent_id || clientId,
                        temp_password: tempPassword?.temp_password
                      }
                    }
                  );
                  
                  if (error) {
                    console.error("Error recreating user:", error);
                  } else {
                    console.log("User account recreated/refreshed:", data);
                  }
                } catch (createError) {
                  console.error("Exception recreating user:", createError);
                }
              } else {
                // If passwords match but login still failed, there might be an issue with the Supabase auth record
                setErrorMessage(
                  "Your password appears correct but login failed. The account may not be properly set up. Please contact support."
                );
                
                // Try to recreate/update the user account
                try {
                  const { data, error } = await supabase.functions.invoke(
                    'create-client-user',
                    {
                      body: {
                        email: email,
                        client_id: tempPassword?.agent_id || clientId,
                        temp_password: tempPassword?.temp_password
                      }
                    }
                  );
                  
                  if (error) {
                    console.error("Error recreating user:", error);
                  } else {
                    console.log("User account recreated:", data);
                    
                    // Try signing in again after recreating
                    const { error: retryError } = await supabase.auth.signInWithPassword({
                      email,
                      password: tempPassword.temp_password,
                    });
                    
                    if (retryError) {
                      console.error("Retry sign in error:", retryError);
                      setErrorMessage("Account recreated but sign in still failed. Please try again or contact support.");
                    } else {
                      console.log("Retry sign in successful after recreation");
                      toast.success("Successfully signed in!");
                    }
                  }
                } catch (createError) {
                  console.error("Exception recreating user:", createError);
                }
              }
            } else {
              console.log("No temporary password found for email:", email);
              setErrorMessage("No account found with this email address. Please check your email or contact support.");
            }
          } catch (tempCheckError) {
            console.error("Error checking temporary password:", tempCheckError);
            setErrorMessage("An error occurred while verifying your credentials. Please try again.");
          }
        } else {
          setErrorMessage(error.message || "Failed to sign in");
        }
        
        toast.error(errorMessage || "Authentication failed");
      } else {
        console.log("Sign in successful:", authData);
        
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={loading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password should be in the format: Welcome{new Date().getFullYear()}#XXX
              </p>
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
