
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

type AuthCallbackProps = {
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  determineUserRole: (user: User) => Promise<UserRole>;
};

export const useAuthCallback = ({
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  determineUserRole
}: AuthCallbackProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isCallbackUrl) {
      const handleCallback = async () => {
        try {
          // Set a flag to avoid infinite loops
          const hasAttemptedAuth = sessionStorage.getItem('auth_callback_attempted');
          if (hasAttemptedAuth) {
            console.log("Auth callback already attempted, preventing loop");
            navigate('/auth', { replace: true });
            setIsLoading(false);
            return;
          }
          
          // Set the flag to prevent future loops in this session
          sessionStorage.setItem('auth_callback_attempted', 'true');
          
          // Get the session from the URL
          const { data: { session: callbackSession }, error: sessionError } = 
            await supabase.auth.getSession();
            
          if (sessionError || !callbackSession) {
            console.error("Error getting session from callback URL:", sessionError);
            toast.error("Authentication failed. Please try again.");
            navigate('/auth', { replace: true });
            setIsLoading(false);
            return;
          }
          
          const user = callbackSession.user;
          if (!user) {
            console.error("No user found in callback session");
            navigate('/auth', { replace: true });
            setIsLoading(false);
            return;
          }
          
          // For Google SSO, we always set admin role and redirect to admin dashboard
          const provider = user?.app_metadata?.provider;
          const isGoogleLogin = provider === 'google';
          
          console.log("Auth callback processing for user:", user.email, "Provider:", provider);
          
          if (isGoogleLogin) {
            console.log("Google SSO detected, setting admin role");
            // Set session and user
            setSession(callbackSession);
            setUser(user);
            
            // For Google SSO users, always set admin role
            setUserRole('admin');
            
            // Clear the auth attempt flag after successful login
            setTimeout(() => {
              sessionStorage.removeItem('auth_callback_attempted');
            }, 1000);
            
            console.log("Redirecting Google SSO user to admin dashboard");
            // Force direct window location change for a clean redirect
            window.location.href = '/';
          } else {
            // Non-Google login, use role-based redirect
            setSession(callbackSession);
            setUser(user);
            
            // Get user role based on email presence in clients table
            const role = await determineUserRole(user);
            setUserRole(role);
            setIsLoading(false);
            
            // Clear the auth attempt flag after successful login
            setTimeout(() => {
              sessionStorage.removeItem('auth_callback_attempted');
            }, 1000);
            
            console.log("Redirecting regular user based on role:", role);
            // Use direct location change to ensure a clean state
            if (role === 'client') {
              window.location.href = '/client/dashboard';
            } else {
              window.location.href = '/';
            }
          }
        } catch (error) {
          console.error("Error handling auth callback:", error);
          toast.error("Authentication failed. Please try again.");
          sessionStorage.removeItem('auth_callback_attempted');
          navigate('/auth', { replace: true });
          setIsLoading(false);
        }
      };
      
      handleCallback();
    }
  }, [isCallbackUrl, navigate, setSession, setUser, setUserRole, setIsLoading, determineUserRole]);
};
