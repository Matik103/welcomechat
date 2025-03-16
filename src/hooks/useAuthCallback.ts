
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
          
          // For Google SSO, always set as admin (no role determination)
          setUserRole('admin');
          
          // Store the role in sessionStorage to persist it
          sessionStorage.setItem('user_role_set', 'admin');
          
          console.log("SSO user set as admin, redirecting to admin dashboard");
          
          // Navigate to admin dashboard
          navigate('/', { replace: true });
          
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
