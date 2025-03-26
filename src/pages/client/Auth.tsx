
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

const ClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { user, isLoading, userRole } = useAuth();
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  // For debugging only
  useEffect(() => {
    console.log("Current user state:", { user, userRole, isLoading });
  }, [user, userRole, isLoading]);

  if (isLoading && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) {
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
      console.log("Starting email login for:", email);
      
      // First, try to find client_id associated with this email
      const { data: clientData, error: clientLookupError } = await supabase
        .from('ai_agents')
        .select('id, client_id')
        .eq('email', email)
        .eq('interaction_type', 'config')
        .single();
          
      if (clientLookupError) {
        console.error("Error looking up client by email:", clientLookupError);
        // Continue with regular login anyway
      } else if (clientData) {
        console.log("Found client_id for email:", clientData.client_id || clientData.id);
      }
        
      // Proceed with normal login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
        
      if (error) {
        throw error;
      }
        
      console.log("Email login successful for:", email);
      toast.success("Successfully signed in!");
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.message?.includes("Invalid login credentials")) {
        // Check if there's a client associated with this email
        try {
          const { data: clientData, error: clientLookupError } = await supabase
            .from('ai_agents')
            .select('id, client_id')
            .eq('email', email)
            .eq('interaction_type', 'config')
            .single();
            
          if (clientLookupError) {
            console.error("Error looking up client by email for password check:", clientLookupError);
            setErrorMessage("Invalid email or password. Please try again.");
          } else if (clientData) {
            const clientId = clientData.client_id || clientData.id;
            console.log("Found client_id for password check:", clientId);
            
            // Check if there's a temporary password for this client
            const { data: tempPasswords, error: tempPasswordError } = await supabase
              .from('client_temp_passwords')
              .select('temp_password, id')
              .eq('agent_id', clientId)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (tempPasswordError) {
              console.error("Error checking temp passwords:", tempPasswordError);
              setErrorMessage("Invalid email or password. Please make sure you're using the exact password from the welcome email.");
            } 
            else if (tempPasswords && tempPasswords.length > 0) {
              const tempPassword = tempPasswords[0];
              console.log("Found temp password record:", tempPassword.id);
              
              // Check if passwords match
              if (password !== tempPassword.temp_password) {
                console.log("Password mismatch. Expected:", tempPassword.temp_password, "Got:", password);
                // Provide a detailed error message
                const currentYear = new Date().getFullYear();
                setErrorMessage(
                  `The password you entered doesn't match. Please use the exact password from the welcome email (format: Welcome${currentYear}#XXX).`
                );
              } else {
                console.log("Password matches stored temp password but login still failed");
                // Passwords match but login still failed
                setErrorMessage(
                  "Your password appears correct but login failed. The account may not be properly set up."
                );
                
                // Try to recreate the user account
                try {
                  console.log("Attempting to recreate user account with matching password");
                  const { data, error } = await supabase.functions.invoke(
                    'create-client-user',
                    {
                      body: {
                        email: email,
                        client_id: clientId,
                        temp_password: tempPassword.temp_password
                      }
                    }
                  );
                  
                  if (error) {
                    console.error("Error recreating user:", error);
                  } else {
                    console.log("User account recreated:", data);
                    
                    // Try signing in again
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
              console.log("No temporary password found for client:", clientId);
              setErrorMessage("No account found with this email address. Please check your email or contact support.");
            }
          } else {
            setErrorMessage("Invalid email or password. Please try again.");
          }
        } catch (clientLookupError) {
          console.error("Error in client lookup process:", clientLookupError);
          setErrorMessage("An error occurred while verifying your credentials. Please try again.");
        }
      } else {
        // For other types of errors (not "Invalid login credentials")
        setErrorMessage(error.message || "Failed to sign in");
      }
      
      // Display toast with the error message
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error("Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/49c3d031-200e-4995-8d87-ebff9b6b3e4e.png" 
              alt="Welcome.Chat" 
              className="h-14" 
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Sign in to your account
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your AI agent dashboard
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
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAuth;
