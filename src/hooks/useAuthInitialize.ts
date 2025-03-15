import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { determineUserRole, isGoogleSSOUser } from "@/utils/authUtils";

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
          
          // Check if Google SSO authentication
          const isGoogleAuth = isGoogleSSOUser(currentSession.user);
          console.log("Is Google Auth?", isGoogleAuth);
          
          if (isGoogleAuth) {
            // Google SSO users are always assigned admin role
            console.log("Google SSO login detected - assigning admin role");
            setUserRole('admin');
            
            const isAuthPage = location.pathname === '/auth';
            const isClientRoute = location.pathname.startsWith('/client');
            
            if (!isCallbackUrl && (isClientRoute || isAuthPage)) {
              // Always redirect Google SSO users to admin dashboard
              console.log("Redirecting Google SSO user to admin dashboard");
              navigate('/', { replace: true });
              setTimeout(() => {
                setIsLoading(false);
                setAuthInitialized(true);
              }, 300);
            } else {
              setIsLoading(false);
              setAuthInitialized(true);
            }
          } else {
            // For email/password users, determine role from database
            const userRole = await determineUserRole(currentSession.user);
            setUserRole(userRole);
            
            const isAuthPage = location.pathname === '/auth';
            
            if (!isCallbackUrl && isAuthPage) {
              // Determine where to navigate based on role
              const targetPath = userRole === 'admin' ? '/' : '/client/dashboard';
              navigate(targetPath, { replace: true });
              setTimeout(() => {
                setIsLoading(false);
                setAuthInitialized(true);
              }, 300);
            } else {
              setIsLoading(false);
              setAuthInitialized(true);
            }
          }
        } else {
          console.log("No active session found during init");
          setSession(null);
          setUser(null);
          setUserRole(null);
          
          const isAuthPage = location.pathname === '/auth';
              
          if (!isAuthPage && !isCallbackUrl) {
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
          
          // Redirect to auth page on error
          const isAuthPage = location.pathname === '/auth';
          if (!isAuthPage && !isCallbackUrl) {
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
