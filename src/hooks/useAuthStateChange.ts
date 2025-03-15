
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { determineUserRole } from "@/utils/authUtils";

type AuthStateChangeProps = {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export const useAuthStateChange = ({
  setSession,
  setUser,
  setUserRole,
  setIsLoading
}: AuthStateChangeProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("User signed in or token refreshed");
          
          if (!currentSession) {
            console.error("No session found in SIGNED_IN event");
            setIsLoading(false);
            return;
          }
          
          // Set basic session and user data
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Determine user role based on email/client check
          const role = await determineUserRole(currentSession.user);
          setUserRole(role);
          console.log("Determined user role:", role);
          
          setIsLoading(false);
          
          // Only redirect if we're on the auth page to prevent refresh loops
          const isAuthPage = location.pathname === '/auth';
          if (isAuthPage) {
            // Redirect based on role
            const redirectPath = role === 'admin' ? '/' : '/client/dashboard';
            navigate(redirectPath, { replace: true });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          
          // Only redirect to auth page if not already there
          const isAuthPage = location.pathname === '/auth';
          if (!isAuthPage) {
            navigate('/auth', { replace: true });
          }
        } else {
          // Handle other events
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setIsLoading, navigate, location.pathname]);
};
