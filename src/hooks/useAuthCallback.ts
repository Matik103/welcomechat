
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
          console.log("Auth callback processing started");
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
          
          // Set session data - all authenticated users are admins
          setSession(callbackSession);
          setUser(user);
          setUserRole('admin');
          setIsLoading(false);
          
          // Redirect to admin dashboard directly
          console.log("Redirecting user to admin dashboard");
          navigate('/', { replace: true });
          return;
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
