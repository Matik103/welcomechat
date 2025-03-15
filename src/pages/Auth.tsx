
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { session, isLoading, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Define the resetForm function
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setErrorMessage("");
  };

  // Check if we're in the middle of an OAuth callback
  useEffect(() => {
    const checkOAuthRedirect = async () => {
      // If URL contains a hash that might be from OAuth
      if (window.location.hash && (
          window.location.hash.includes('access_token') ||
          window.location.hash.includes('error') ||
          window.location.hash.includes('type=recovery')
      )) {
        console.log("Detected OAuth redirect hash parameters");
        setIsProcessingOAuth(true);
        // The actual processing happens in AuthContext
      }
    };
    
    checkOAuthRedirect();
    
    // Set a timeout to clear the processing state after a reasonable amount of time
    // to prevent users from being stuck at the loading screen if something goes wrong
    const timeoutId = setTimeout(() => {
      if (isProcessingOAuth) {
        console.log("OAuth processing timeout reached, resetting state");
        setIsProcessingOAuth(false);
        
        // Check if we're still on the auth page with hash params that might indicate a failure
        if (location.pathname.includes('/auth') && window.location.hash) {
          toast.error("Authentication process took too long. Please try again.");
          // Clear the hash to allow retrying
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }, 20000); // 20 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [isProcessingOAuth, location.pathname]);

  // Enhanced redirection logic - this is crucial for fixing the issue
  useEffect(() => {
    // Only attempt redirection if we have session AND userRole AND we're not loading
    if (session && userRole && !isLoading && !isProcessingOAuth) {
      console.log("Ready to redirect with role:", userRole);
      
      // Add a small delay to ensure all state is properly updated
      setTimeout(() => {
        if (userRole === 'client') {
          console.log("Redirecting to client dashboard");
          navigate('/client/dashboard', { replace: true });
        } else if (userRole === 'admin') {
          console.log("Redirecting to admin dashboard");
          navigate('/', { replace: true });
        }
      }, 100);
    }
  }, [session, userRole, isLoading, isProcessingOAuth, navigate]);

  // If we're processing OAuth or checking auth, show loading spinner
  if (isLoading || isProcessingOAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isProcessingOAuth ? "Processing your login..." : "Authenticating..."}
          </p>
          {isProcessingOAuth && (
            <p className="text-sm text-muted-foreground max-w-md text-center">
              Processing your login. If this takes more than a few seconds, you may need to refresh the page.
            </p>
          )}
        </div>
      </div>
    );
  }

  // If user is authenticated but has no role yet, show a loading state
  if (session && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to the appropriate dashboard
  if (session && userRole) {
    if (userRole === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Check if email already exists in Supabase
  const checkEmailExists = async (email: string) => {
    setIsCheckingEmail(true);
    try {
      console.log("Checking if email exists:", email);
      // Call the auth.admin.getUserByEmail() through a secure edge function
      const { data, error } = await supabase.functions.invoke("check-email-exists", {
        body: { email }
      });
      
      if (error) {
        console.error("Error from check-email-exists:", error);
        throw error;
      }
      
      console.log("Email check result:", data);
      return data.exists;
    } catch (error: any) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthLoading || isCheckingEmail) return;
    setIsAuthLoading(true);
    setErrorMessage(""); // Clear any previous error

    try {
      if (isForgotPassword) {
        console.log("Sending password reset email to:", email);
        // Use Supabase's built-in password reset functionality
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        
        if (error) {
          console.error("Password reset error:", error);
          throw error;
        }
        
        toast.success("Password reset email sent. Please check your inbox.");
        setIsForgotPassword(false);
      } else if (isSignUp) {
        console.log("Starting sign up process for:", email);
        
        // Check if email already exists
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          console.log("Email already exists:", email);
          setErrorMessage("An account with this email already exists. Please sign in instead.");
          setIsSignUp(false); // Switch to sign in mode
          setIsAuthLoading(false);
          return;
        }
        
        console.log("Creating new account with email:", email);
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (error) {
          console.error("Sign up error:", error);
          throw error;
        }
        
        console.log("Sign up successful, verification email should be sent");
        toast.success("Check your email for the confirmation link!");
        
        // Log to help debug
        console.log("Auth sign up response:", data);
      } else {
        console.log("Attempting to sign in with email:", email);
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }
        
        console.log("Sign in successful:", data);
        toast.success("Successfully signed in!");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Set a user-friendly error message
      if (error.message?.includes("Invalid login credentials")) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (error.message?.includes("already registered")) {
        setErrorMessage("An account with this email already exists. Please sign in instead.");
        setIsSignUp(false); // Switch to sign in mode
      } else {
        setErrorMessage(error.message || "Authentication failed");
      }
      
      toast.error(errorMessage || "Authentication failed");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Starting Google sign in process");
      
      // Clear any previous errors
      setErrorMessage("");
      setIsProcessingOAuth(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });
      
      if (error) {
        console.error("Google sign in error:", error);
        setErrorMessage(`Google sign in failed: ${error.message}`);
        toast.error(`Google sign in failed: ${error.message}`);
        setIsProcessingOAuth(false);
        throw error;
      }
      
      console.log("Google sign in initiated, redirecting to Google");
      // We don't reset isProcessingOAuth here since we're redirecting to Google
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setErrorMessage(error.message || "Failed to sign in with Google");
      toast.error(error.message || "Failed to sign in with Google");
      setIsProcessingOAuth(false);
    }
  };

  // Reset password form
  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    placeholder="m@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              {errorMessage && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isAuthLoading}>
                {isAuthLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsForgotPassword(false);
                  resetForm();
                }}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create an account" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your details to create your account"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
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
                />
              </div>
              {!isSignUp && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 text-sm"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setEmail("");
                      setPassword("");
                      setErrorMessage("");
                    }}
                  >
                    Forgot password?
                  </Button>
                </div>
              )}
            </div>
            
            {errorMessage && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {errorMessage}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isAuthLoading || isCheckingEmail}>
              {isAuthLoading || isCheckingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isProcessingOAuth}
          >
            {isProcessingOAuth ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting to Google...
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMessage("");
                  }}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage("");
                  }}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
