
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
          
          // Set session data - all authenticated users are admins
          setSession(callbackSession);
          setUser(callbackSession.user);
          setUserRole('admin');
          
          // Important: Navigate to admin dashboard BEFORE setting isLoading to false
          // This prevents any flash of the login screen
          navigate('/', { replace: true });
          
          // Set isLoading to false after the navigation has had time to complete
          setTimeout(() => {
            setIsLoading(false);
          }, 300); // Increased timeout to 300ms to ensure navigation fully completes
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
