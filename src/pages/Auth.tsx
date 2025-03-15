
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2, Github } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  // Enhanced redirection logic - this is crucial for fixing the issue
  useEffect(() => {
    // Only attempt redirection if we have session AND userRole AND we're not loading
    if (session && userRole && !isLoading) {
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
  }, [session, userRole, isLoading, navigate]);

  // If we're checking auth, show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
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

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log("Starting Google sign-in");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
      
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setIsGoogleLoading(false);
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

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F8F9FA] px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full flex gap-2 items-center justify-center" 
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="h-5 w-5">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
                </svg>
                Google
              </>
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
