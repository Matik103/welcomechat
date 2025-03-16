
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
        
        // If we've been stuck loading and not on auth page, redirect to auth
        if (!isAuthPage && !session) {
          console.log("Redirecting to auth page due to timeout");
          navigate('/auth', { replace: true });
        }
      }
    }, 5000); // Extend to 5 seconds to allow for slow connections
    
    return () => clearTimeout(safetyTimeout);
  }, [isLoading, navigate, isAuthPage, session, setIsLoading]);
};
