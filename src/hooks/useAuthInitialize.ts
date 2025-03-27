
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
    let navigationInProgress = false;

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
          const isAuthPage = location.pathname === '/auth';
          const isRootPage = location.pathname === '/';
          const isOldAdminPage = !location.pathname.startsWith('/admin/') && 
                               !location.pathname.startsWith('/client/') && 
                               location.pathname !== '/auth';
          
          if ((isAuthPage || isRootPage || isOldAdminPage) && !navigationInProgress) {
            // Get the appropriate dashboard route
            const dashboardRoute = getDashboardRoute(determinedUserRole);
            console.log("Redirecting to dashboard in init:", dashboardRoute);
            // Navigate to the appropriate dashboard
            navigationInProgress = true;
            
            // Set initialized first, then navigate with a small delay to prevent UI glitches
            setAuthInitialized(true);
            
            setTimeout(() => {
              navigate(dashboardRoute, { replace: true });
              
              // Clear loading state after navigation is queued
              if (mounted) setIsLoading(false);
              
              // Reset navigation flag after a delay
              setTimeout(() => {
                navigationInProgress = false;
              }, 500);
            }, 300);
          } else {
            // Set initialized first, then clear loading state to prevent flicker
            setAuthInitialized(true);
            setTimeout(() => {
              if (mounted) setIsLoading(false);
            }, 300);
          }
        } else {
          console.log("No active session found during init");
          setSession(null);
          setUser(null);
          setUserRole(null);
          sessionStorage.removeItem('user_role_set');
          
          const isAuthPage = location.pathname === '/auth';
          const isSetupPage = location.pathname.startsWith('/client/setup');
              
          if (!isAuthPage && !isSetupPage && !navigationInProgress) {
            console.log("No session, redirecting to auth page in init");
            navigationInProgress = true;
            
            setAuthInitialized(true);
            
            setTimeout(() => {
              navigate('/auth', { replace: true });
              setIsLoading(false);
              
              // Reset navigation flag after a delay
              setTimeout(() => {
                navigationInProgress = false;
              }, 500);
            }, 300);
          } else {
            setAuthInitialized(true);
            setIsLoading(false);
          }
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
          
          if (!isAuthPage && !isSetupPage && !navigationInProgress) {
            navigationInProgress = true;
            setTimeout(() => {
              navigate('/auth', { replace: true });
              
              // Reset navigation flag after a delay
              setTimeout(() => {
                navigationInProgress = false;
              }, 500);
            }, 300);
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
