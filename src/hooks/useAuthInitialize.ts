import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

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
          
          // Check if we have a stored role
          const storedRole = sessionStorage.getItem('user_role_set');
          let determinedUserRole: UserRole;
          
          if (storedRole && (storedRole === 'admin' || storedRole === 'client')) {
            console.log("Using stored role from session:", storedRole);
            setUserRole(storedRole as UserRole);
            determinedUserRole = storedRole as UserRole;
          } else {
            // Determine role from database
            determinedUserRole = await determineUserRole(currentSession.user);
            setUserRole(determinedUserRole);
            sessionStorage.setItem('user_role_set', determinedUserRole);
          }
          
          // Handle redirects if on auth page or at root
          const isAuthPage = location.pathname === '/auth';
          const isRootPage = location.pathname === '/';
          const isOldAdminPage = !location.pathname.startsWith('/admin/') && 
                               !location.pathname.startsWith('/client/') && 
                               location.pathname !== '/auth';
          
          if (isAuthPage || isRootPage || isOldAdminPage) {
            // Get the appropriate dashboard route
            const dashboardRoute = getDashboardRoute(determinedUserRole);
            
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
          
          const isAuthPage = location.pathname === '/auth';
          const isSetupPage = location.pathname.startsWith('/client/setup');
              
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
          const isAuthPage = location.pathname === '/auth';
          const isSetupPage = location.pathname.startsWith('/client/setup');
          
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
    navigate, 
    location.pathname, 
    authInitialized, 
    setSession, 
    setUser, 
    setUserRole, 
    setIsLoading, 
    setAuthInitialized, 
    isCallbackUrl
  ]);
};
