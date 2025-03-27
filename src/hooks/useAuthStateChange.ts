
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
    let navigationInProgress = false;
    let navigationTimeout: NodeJS.Timeout | null = null;

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        // Skip processing if we're on the callback URL or if callback is being processed
        // This prevents double processing with useAuthCallback
        const inCallbackProcess = 
          location.pathname.includes('/auth/callback') || 
          sessionStorage.getItem('auth_callback_processing') === 'true' ||
          navigationInProgress;
          
        if (inCallbackProcess) {
          console.log("Skipping auth state change - callback is being processed or navigation in progress");
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
            const isAuthPage = location.pathname === '/auth' || location.pathname === '/';
            const isAdminPage = location.pathname.startsWith('/admin/');
            
            if (isAuthPage || !isAdminPage) {
              console.log("Redirecting Google user to admin dashboard");
              
              // Clear any existing navigation timeout
              if (navigationTimeout) {
                clearTimeout(navigationTimeout);
              }
              
              navigationInProgress = true;
              
              // Set a debounce to prevent multiple rapid navigations
              navigationTimeout = setTimeout(() => {
                navigate('/admin/dashboard', { replace: true });
                
                // Reset navigation flag after a longer delay
                setTimeout(() => {
                  navigationInProgress = false;
                }, 2000);
              }, 500);
            }
          } else {
            // Determine role from database for non-Google users
            const determinedUserRole = await determineUserRole(currentSession.user);
            setUserRole(determinedUserRole);
            sessionStorage.setItem('user_role_set', determinedUserRole);
            
            // Only redirect if we're on the auth page
            const isAuthPage = location.pathname === '/auth' || location.pathname === '/';
            if (isAuthPage) {
              const dashboardRoute = getDashboardRoute(determinedUserRole);
              console.log("Redirecting to dashboard:", dashboardRoute);
              
              // Clear any existing navigation timeout
              if (navigationTimeout) {
                clearTimeout(navigationTimeout);
              }
              
              navigationInProgress = true;
              
              // Set a debounce to prevent multiple rapid navigations
              navigationTimeout = setTimeout(() => {
                navigate(dashboardRoute, { replace: true });
                
                // Reset navigation flag after a longer delay
                setTimeout(() => {
                  navigationInProgress = false;
                }, 2000);
              }, 500);
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
          const isAuthPage = location.pathname === '/auth';
          if (!isAuthPage && !navigationInProgress) {
            // Clear any existing navigation timeout
            if (navigationTimeout) {
              clearTimeout(navigationTimeout);
            }
            
            navigationInProgress = true;
            
            // Set a debounce to prevent multiple rapid navigations
            navigationTimeout = setTimeout(() => {
              navigate('/auth', { replace: true });
              
              // Reset navigation flag after a longer delay
              setTimeout(() => {
                navigationInProgress = false;
              }, 2000);
            }, 500);
          }
        } else {
          // Handle other events
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setIsLoading, navigate, location.pathname]);
};
