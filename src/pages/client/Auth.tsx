
import { useState, useEffect } from "react";
import { Navigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { recoverClientAccount } from '@/utils/clientUtils';

const ClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { user, isLoading, userRole } = useAuth();
  const [loadTimeout, setLoadTimeout] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const recoveryToken = queryParams.get('recovery');

  // Show loading state visually after a short delay to avoid flashes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadTimeout(true);
    }, 200); // Shorter timeout for better UX
    
    return () => clearTimeout(timeout);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("ClientAuth component rendered with state:", { user, userRole, isLoading });
  }, [user, userRole, isLoading]);

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Handle account recovery flow
  useEffect(() => {
    const handleRecovery = async () => {
      if (recoveryToken) {
        setIsRecovering(true);
        try {
          const result = await recoverClientAccount(recoveryToken);
          
          if (result.success) {
            setRecoverySuccess(true);
            toast.success("Your account has been successfully recovered!");
            setTimeout(() => {
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
            }, 500);
          } else {
            toast.error("Account recovery failed. The link may be invalid or expired.");
          }
        } catch (error) {
          console.error("Error recovering account:", error);
          toast.error("An error occurred while attempting to recover your account");
        } finally {
          setIsRecovering(false);
        }
      }
    };
    
    handleRecovery();
  }, [recoveryToken]);

  // Show loading spinner while auth is initializing, but with a timeout
  // to avoid infinite spinner if auth gets stuck
  if (isLoading && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect if user is already authenticated
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-sm text-gray-500">Verifying your account...</p>
          <p className="mt-2 text-xs text-gray-400">This should only take a moment</p>
        </div>
      );
    }
  }

  // Account recovery UI
  if (isRecovering) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Account Recovery</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we restore your account...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Recovery success UI
  if (recoverySuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-gray-900">Account Recovered!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account has been successfully recovered and is now active again.
            </p>
            <div className="mt-5">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main login form
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setErrorMessage("");

    try {
      console.log("Starting email login for:", email);
      
      // Check if this email corresponds to a client
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
        
      // Attempt login with timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Race against a timeout to prevent hanging
      const { data, error } = await Promise.race([
        signInPromise,
        new Promise<{data: null, error: Error}>(resolve => 
          setTimeout(() => resolve({
            data: null, 
            error: new Error('Login attempt timed out')
          }), 5000)
        )
      ]);
        
      if (error) {
        throw error;
      }
        
      console.log("Email login successful for:", email);
      toast.success("Successfully signed in!");
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.message?.includes("Invalid login credentials")) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (error.message?.includes("timed out")) {
        setErrorMessage("Login attempt timed out. Please try again.");
      } else {
        setErrorMessage(error.message || "Failed to sign in");
      }
      
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
              <Label htmlFor="email" variant="blue">Email</Label>
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
              <Label htmlFor="password" variant="blue">Password</Label>
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
              className="w-full bg-blue-600 hover:bg-blue-700" 
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
