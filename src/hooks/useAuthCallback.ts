
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { isClientInDatabase } from "@/utils/authUtils";

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
          console.log("Auth callback processing started");
          
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
          
          // Check if Google SSO
          const provider = user?.app_metadata?.provider;
          const isGoogleLogin = provider === 'google';
          
          console.log("Auth callback processing for user:", user.email, "Provider:", provider);
          
          if (isGoogleLogin) {
            console.log("Google SSO detected");
            
            // For Google SSO users, check if they're in the clients table
            // If they are, they should use email/password login instead
            const isClientEmail = await isClientInDatabase(user.email || '');
            
            if (isClientEmail) {
              console.error("Google SSO user's email exists in clients table");
              // Sign them out
              await supabase.auth.signOut();
              // Clear session data
              setSession(null);
              setUser(null);
              setUserRole(null);
              
              // Show error message
              toast.error("This email is registered as a client. Please sign in with your email and password instead.");
              navigate('/auth', { replace: true });
              setIsLoading(false);
              return;
            }
            
            // Set session data
            setSession(callbackSession);
            setUser(user);
            setUserRole('admin');
            setIsLoading(false);
            
            // Redirect to admin dashboard
            console.log("Redirecting Google SSO user to admin dashboard");
            window.location.href = '/';
            return;
          } else {
            // For non-Google users, determine role based on email
            const role = await determineUserRole(user);
            
            // Set session data
            setSession(callbackSession);
            setUser(user);
            setUserRole(role);
            setIsLoading(false);
            
            // Redirect based on role
            console.log(`Redirecting user to ${role} dashboard`);
            window.location.href = role === 'admin' ? '/' : '/client/dashboard';
            return;
          }
        } catch (error) {
          console.error("Error handling auth callback:", error);
          toast.error("Authentication failed. Please try again.");
          navigate('/auth', { replace: true });
          setIsLoading(false);
        }
      };
      
      handleCallback();
    }
  }, [isCallbackUrl, navigate, setSession, setUser, setUserRole, setIsLoading, determineUserRole]);
};
