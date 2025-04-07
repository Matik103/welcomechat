
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

  // Improved safety timeout with better caching
  useEffect(() => {
    // Only set a timeout if we're in loading state
    if (!isLoading) return;
    
    console.log("Setting up safety timeout for loading state");
    
    // Store current auth state in session storage to help with page refreshes
    if (session) {
      try {
        const minimalState = {
          hasSession: true,
          role: session.user?.user_metadata?.role,
          timeStamp: Date.now()
        };
        sessionStorage.setItem('auth_state_cache', JSON.stringify(minimalState));
      } catch (err) {
        console.error("Failed to cache auth state:", err);
      }
    }
    
    // Use a shorter timeout - 1 second is enough to prevent blank screens
    const timeoutDuration = 1000;
    
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Safety timeout completing - preventing blank screen");
        setIsLoading(false);
      }
    }, timeoutDuration);
    
    return () => clearTimeout(safetyTimeout);
  }, [isLoading, navigate, isAuthPage, session, setIsLoading]);
};
