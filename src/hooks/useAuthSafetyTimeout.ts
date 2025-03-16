
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

type AuthSafetyTimeoutProps = {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isAuthPage: boolean;
  session: Session | null;
};

export const useAuthSafetyTimeout = ({
  isLoading,
  setIsLoading,
  isAuthPage,
  session
}: AuthSafetyTimeoutProps) => {
  const navigate = useNavigate();

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    // Only set a timeout if we're in loading state
    if (!isLoading) return;
    
    console.log("Setting up safety timeout for loading state");
    
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Safety timeout triggered - forcing loading state to complete");
        setIsLoading(false);
        
        // Clear callback processed flag
        sessionStorage.removeItem('auth_callback_processed');
        
        // If we've been stuck loading and not on auth page, redirect to auth
        if (!isAuthPage && !session) {
          console.log("Redirecting to auth page due to timeout");
          navigate('/auth', { replace: true });
        } else if (session) {
          // If we have a session, check role in session storage
          const userRole = sessionStorage.getItem('user_role_set');
          if (userRole === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else if (userRole === 'client') {
            navigate('/client/dashboard', { replace: true });
          } else {
            // Default to admin dashboard if no role found
            navigate('/admin/dashboard', { replace: true });
          }
        }
      }
    }, 3000); // Use 3 seconds as safety timeout
    
    return () => clearTimeout(safetyTimeout);
  }, [isLoading, navigate, isAuthPage, session, setIsLoading]);
};
