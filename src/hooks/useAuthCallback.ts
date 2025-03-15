
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
          
          // Set basic session and user data
          setSession(callbackSession);
          setUser(callbackSession.user);
          
          // Check if this is a Google SSO login
          const isGoogleUser = callbackSession.user?.app_metadata?.provider === 'google';
          
          // Determine role based on Google SSO or email/client check
          let role: UserRole;
          if (isGoogleUser) {
            console.log("Google SSO user detected in callback - setting admin role");
            role = 'admin';
          } else {
            role = await determineUserRole(callbackSession.user);
            console.log("Determined user role from callback:", role);
          }
          
          setUserRole(role);
          setIsLoading(false);
          
          // Redirect based on role
          const redirectPath = role === 'admin' ? '/' : '/client/dashboard';
          console.log(`Redirecting user to ${redirectPath} based on role: ${role}`);
          navigate(redirectPath, { replace: true });
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
