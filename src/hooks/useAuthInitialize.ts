import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { determineUserRole, getDashboardRoute } from "@/utils/authUtils";

type AuthInitializeProps = {
  authInitialized: boolean;
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
};

export const useAuthInitialize = ({
  authInitialized,
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  setAuthInitialized
}: AuthInitializeProps) => {
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

    const initializeAuth = async () => {
      // Skip init if already initialized or handling callback
      if (authInitialized || isCallbackUrl) return;
      
      try {
        console.log("Initializing auth state");
        
        // Keep loading state true until we've completed all checks
        setIsLoading(true);
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Session found during init:", currentSession.user.email);
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Always check for client status
          const determinedUserRole = await determineUserRole(currentSession.user);
          console.log("User role determined in init:", determinedUserRole, "for", currentSession.user.email);
          setUserRole(determinedUserRole);
          sessionStorage.setItem('user_role_set', determinedUserRole);
          
          // Handle redirects if on auth page or at root
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/auth';
          const isRootPage = currentPath === '/';
          const isOldAdminPage = !currentPath.startsWith('/admin/') && 
                               !currentPath.startsWith('/client/') && 
                               currentPath !== '/auth';
          
          if (isAuthPage || isRootPage || isOldAdminPage) {
            // Get the appropriate dashboard route
            const dashboardRoute = getDashboardRoute(determinedUserRole);
            console.log("Redirecting to dashboard in init:", dashboardRoute);
            // Navigate to the appropriate dashboard
            navigate(dashboardRoute, { replace: true });
          }
          
          // Set initialized first, then clear loading state to prevent flicker
          setAuthInitialized(true);
          setTimeout(() => {
            if (mounted) setIsLoading(false);
          }, 300);
        } else {
          console.log("No active session found during init");
          setSession(null);
          setUser(null);
          setUserRole(null);
          sessionStorage.removeItem('user_role_set');
          
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/auth';
          const isSetupPage = currentPath.startsWith('/client/setup');
              
          if (!isAuthPage && !isSetupPage) {
            console.log("No session, redirecting to auth page in init");
            navigate('/auth', { replace: true });
          }
          
          setAuthInitialized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setAuthInitialized(true);
          setIsLoading(false);
          sessionStorage.removeItem('user_role_set');
          
          // Redirect to auth page on error
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/auth';
          const isSetupPage = currentPath.startsWith('/client/setup');
          
          if (!isAuthPage && !isSetupPage) {
            navigate('/auth', { replace: true });
          }
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [
    authInitialized, 
    setSession, 
    setUser, 
    setUserRole, 
    setIsLoading, 
    setAuthInitialized, 
    isCallbackUrl
  ]);
};
