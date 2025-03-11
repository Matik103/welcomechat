import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { session, isLoading } = useAuth();
  const location = useLocation();

  // Process token from URL if we're on the reset-password or callback page
  useEffect(() => {
    const processToken = async () => {
      // Check if we're on the reset password or callback route
      const isResetPasswordRoute = location.pathname === "/auth/reset-password";
      const isCallbackRoute = location.pathname === "/auth/callback";
      
      if (!isResetPasswordRoute && !isCallbackRoute) {
        setIsProcessingToken(false);
        return;
      }
      
      console.log("Processing token on route:", location.pathname);
      
      try {
        // First check for error parameters in the URL hash
        const fragment = location.hash;
        
        if (fragment && fragment.includes("error=")) {
          console.log("Found error in URL hash:", fragment);
          const params = new URLSearchParams(fragment.substring(1));
          const error = params.get("error");
          const errorCode = params.get("error_code");
          const errorDescription = params.get("error_description");
          
          console.error("Auth error from URL:", { error, errorCode, errorDescription });
          
          // Handle specific error types
          if (errorCode === "otp_expired") {
            setErrorMessage("Your password reset link has expired. Please request a new one.");
            toast.error("Your password reset link has expired. Please request a new one.");
            setIsForgotPassword(true); // Show the forgot password form
          } else {
            setErrorMessage(errorDescription || "Authentication failed. Please try again.");
            toast.error(errorDescription || "Authentication failed. Please try again.");
          }
          
          setIsProcessingToken(false);
          return;
        }
        
        // Check for access_token in the URL hash (password reset or magic link)
        if (fragment && fragment.includes("access_token")) {
          console.log("Found access token in URL hash");
          const params = new URLSearchParams(fragment.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token") || "";
          const type = params.get("type");
          
          if (accessToken) {
            // If it's a recovery (password reset), show the reset password form
            if (type === "recovery") {
              console.log("Processing password reset token");
              
              // Just store token in auth state, show reset form
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error("Error setting session for password reset:", error);
                throw new Error("Invalid or expired password reset link");
              }
              
              // Show password reset form instead of login form
              setIsResetPassword(true);
              toast.info("Please set your new password");
            } else {
              // For other token types (like magic link or signup confirmation)
              console.log("Processing authentication token");
              
              // Exchange the token for a session
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error("Error setting session:", error);
                throw error;
              }
              
              toast.success("Authentication successful!");
            }
          }
        } else if (isResetPasswordRoute) {
          console.log("No token found in URL on reset password page");
          // If no token found on reset password page, show error
          setErrorMessage("Invalid or expired password reset link");
          toast.error("Invalid or expired password reset link");
          setIsForgotPassword(true); // Show the forgot password form
        }
      } catch (error) {
        console.error("Error processing token:", error);
        setErrorMessage(error.message || "Authentication failed");
        toast.error(error.message || "Authentication failed");
        
        // For password reset errors, show the forgot password form
        if (location.pathname === "/auth/reset-password") {
          setIsForgotPassword(true);
        }
      } finally {
        setIsProcessingToken(false);
      }
    };
    
    processToken();
  }, [location]);

  // Show loading spinner while checking auth state or processing token
  if (isLoading || isProcessingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect authenticated users to the main dashboard (unless we're resetting password)
  if (session && !isResetPassword) {
    return <Navigate to="/" replace />;
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthLoading) return;
    setIsAuthLoading(true);
    setErrorMessage("");
    
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsAuthLoading(false);
      return;
    }
    
    try {
      console.log("Resetting password");
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error("Error resetting password:", error);
        throw error;
      }
      
      toast.success("Password updated successfully. Please sign in with your new password.");
      
      // Reset form and show login screen
      setIsResetPassword(false);
      setPassword("");
      setConfirmPassword("");
      
    } catch (error) {
      console.error("Error in password reset:", error);
      setErrorMessage(error.message || "Failed to reset password");
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsAuthLoading(false);
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
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      
      if (error) {
        console.error("Google sign in error:", error);
        throw error;
      }
      
      console.log("Google sign in initiated:", data);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAuthLoading || !email) return;
    setIsAuthLoading(true);
    setErrorMessage("");
    
    try {
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
    } catch (error) {
      console.error("Password reset request error:", error);
      setErrorMessage(error.message || "Failed to send password reset email");
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Reset password form (after clicking reset link in email)
  if (isResetPassword) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription>
              Please create a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password form (request reset email)
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
            <form onSubmit={handleForgotPassword} className="space-y-4">
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

  // Standard login/signup form
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
                      resetForm();
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
          >
            Continue with Google
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
