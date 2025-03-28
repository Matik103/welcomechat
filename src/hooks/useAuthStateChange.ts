
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
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
  // Use a navigation function that doesn't rely on react-router
  const navigate = (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        // Skip processing if we're on the callback URL or if callback is being processed
        // This prevents double processing with useAuthCallback
        const currentPath = window.location.pathname;
        const inCallbackProcess = 
          currentPath.includes('/auth/callback') || 
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
          
          // Check if Google SSO user by looking at provider in app_metadata
          const isGoogleUser = currentSession.user?.app_metadata?.provider === 'google';
          
          if (isGoogleUser) {
            console.log("Google SSO user detected in state change, setting role as admin");
            setUserRole('admin');
            sessionStorage.setItem('user_role_set', 'admin');
            
            // Only redirect if we're on the auth page or we're not already on an admin page
            const isAuthPage = currentPath === '/auth' || currentPath === '/';
            const isAdminPage = currentPath.startsWith('/admin/');
            
            if (isAuthPage || !isAdminPage) {
              console.log("Redirecting Google user to admin dashboard");
              navigate('/admin/dashboard', { replace: true });
            }
          } else {
            // Determine role from database for non-Google users
            const determinedUserRole = await determineUserRole(currentSession.user);
            setUserRole(determinedUserRole);
            sessionStorage.setItem('user_role_set', determinedUserRole);
            
            // Only redirect if we're on the auth page
            const isAuthPage = currentPath === '/auth' || currentPath === '/';
            if (isAuthPage) {
              const dashboardRoute = getDashboardRoute(determinedUserRole);
              console.log("Redirecting to dashboard:", dashboardRoute);
              navigate(dashboardRoute, { replace: true });
            }
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
          const isAuthPage = currentPath === '/auth';
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
  }, [setSession, setUser, setUserRole, setIsLoading]);
};
