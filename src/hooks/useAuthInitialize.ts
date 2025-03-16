
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { determineUserRole } from "@/utils/authUtils";

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
      if (authInitialized && !isCallbackUrl) return;
      
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
          
          if (!isCallbackUrl && (isAuthPage || (isRootPage && determinedUserRole === 'client'))) {
            // Redirect based on role to the appropriate dashboard
            const targetPath = determinedUserRole === 'client' 
              ? '/client/dashboard' 
              : '/';
              
            navigate(targetPath, { replace: true });
            setTimeout(() => {
              setIsLoading(false);
              setAuthInitialized(true);
            }, 300);
          } else {
            setIsLoading(false);
            setAuthInitialized(true);
          }
        } else {
          console.log("No active session found during init");
          setSession(null);
          setUser(null);
          setUserRole(null);
          sessionStorage.removeItem('user_role_set');
          
          const isAuthPage = location.pathname === '/auth';
          const isSetupPage = location.pathname.startsWith('/client/setup');
              
          if (!isAuthPage && !isCallbackUrl && !isSetupPage) {
            console.log("No session, redirecting to auth page in init");
            navigate('/auth', { replace: true });
          }
          
          setIsLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          setAuthInitialized(true);
          sessionStorage.removeItem('user_role_set');
          
          // Redirect to auth page on error
          const isAuthPage = location.pathname === '/auth';
          const isSetupPage = location.pathname.startsWith('/client/setup');
          
          if (!isAuthPage && !isCallbackUrl && !isSetupPage) {
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
