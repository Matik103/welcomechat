
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { determineUserRole } from "@/utils/authUtils";

type AuthCallbackProps = {
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export const useAuthCallback = ({
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading
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
            navigate('/auth', { replace: true });
            setIsLoading(false);
            return;
          }
          
          // Set session and user data
          setSession(callbackSession);
          setUser(callbackSession.user);
          
          // Check if this is a Google SSO authentication
          const isGoogleAuth = callbackSession.user?.app_metadata?.provider === 'google';
          
          if (isGoogleAuth) {
            console.log("Google SSO login detected in callback, assigning admin role");
            // Google SSO users are always assigned admin role
            setUserRole('admin');
            
            // ALWAYS navigate to admin dashboard for Google SSO users
            console.log("Navigating to admin dashboard from callback");
            navigate('/', { replace: true });
          } else {
            // For email/password users, determine role from database
            const userRole = await determineUserRole(callbackSession.user);
            setUserRole(userRole);
            
            // Navigate based on user role
            const targetPath = userRole === 'admin' ? '/' : '/client/dashboard';
            console.log("Navigating to:", targetPath);
            navigate(targetPath, { replace: true });
          }
          
          // Set isLoading to false after the navigation has had time to complete
          setTimeout(() => {
            setIsLoading(false);
          }, 300);
        } catch (error) {
          console.error("Error handling auth callback:", error);
          navigate('/auth', { replace: true });
          setIsLoading(false);
        }
      };
      
      handleCallback();
    }
  }, [isCallbackUrl, navigate, setSession, setUser, setUserRole, setIsLoading]);
};
