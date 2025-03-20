
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { determineUserRole, getDashboardRoute } from "@/utils/authUtils";

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
        
        // Skip processing if we're on the callback URL or if callback is being processed
        // This prevents double processing with useAuthCallback
        const inCallbackProcess = 
          location.pathname.includes('/auth/callback') || 
          sessionStorage.getItem('auth_callback_processing') === 'true';
          
        if (inCallbackProcess) {
          console.log("Skipping auth state change - callback is being processed");
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("User signed in or token refreshed");
          
          if (!currentSession) {
            console.error("No session found in SIGNED_IN event");
            setIsLoading(false);
            return;
          }
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check if we have a stored role
          const storedRole = sessionStorage.getItem('user_role_set');
          let determinedUserRole: UserRole;
          
          // Check if Google SSO user
          const isGoogleUser = currentSession.user?.app_metadata?.provider === 'google';
          
          if (isGoogleUser) {
            console.log("Google SSO user detected in state change");
            determinedUserRole = 'admin';
            setUserRole('admin');
            sessionStorage.setItem('user_role_set', 'admin');
          } else {
            // Determine role from database - always check for client record first
            determinedUserRole = await determineUserRole(currentSession.user);
            setUserRole(determinedUserRole);
            sessionStorage.setItem('user_role_set', determinedUserRole);
          }
          
          // Only redirect if we're on the auth page
          const isAuthPage = location.pathname === '/auth' || location.pathname === '/';
          if (isAuthPage) {
            // Get the appropriate dashboard route
            const dashboardRoute = getDashboardRoute(determinedUserRole);
            console.log("Redirecting to dashboard:", dashboardRoute);
            
            navigate(dashboardRoute, { replace: true });
          }
          
          // Set loading to false immediately
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          sessionStorage.removeItem('user_role_set');
          sessionStorage.removeItem('auth_callback_processed');
          sessionStorage.removeItem('auth_callback_processing');
          
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
