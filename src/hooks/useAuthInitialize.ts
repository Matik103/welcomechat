
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
          console.log("Auth provider:", currentSession.user?.app_metadata?.provider);
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check if Google SSO authentication
          const isGoogleAuth = currentSession.user?.app_metadata?.provider === 'google';
          
          if (isGoogleAuth) {
            // Google SSO users are always assigned admin role
            console.log("Google SSO login detected in init, assigning admin role");
            setUserRole('admin');
            
            const isAuthPage = location.pathname === '/auth';
            
            if (!isCallbackUrl && isAuthPage) {
              console.log("Redirecting from auth page to admin dashboard in init");
              
              // Navigate first while keeping loading state true
              navigate('/', { replace: true });
              
              // Longer timeout to ensure transition completes before changing loading state
              setTimeout(() => {
                setIsLoading(false);
                setAuthInitialized(true);
              }, 300);
            } else if (!isCallbackUrl && location.pathname.startsWith('/client')) {
              // Force redirect any Google SSO users away from client routes to admin dashboard
              console.log("Google SSO user on client route - redirecting to admin dashboard");
              navigate('/', { replace: true });
              
              setTimeout(() => {
                setIsLoading(false);
                setAuthInitialized(true);
              }, 300);
            } else {
              // For non-auth pages, just update the state
              setIsLoading(false);
              setAuthInitialized(true);
            }
          } else {
            // For email/password users, determine role from database
            const userRole = await determineUserRole(currentSession.user);
            setUserRole(userRole);
            
            console.log("User role determined in init:", userRole);
            
            const isAuthPage = location.pathname === '/auth';
            
            if (!isCallbackUrl && isAuthPage) {
              console.log("Redirecting from auth page to dashboard based on role in init");
              // Determine where to navigate based on role
              const targetPath = userRole === 'admin' ? '/' : '/client/dashboard';
              
              // Navigate first while keeping loading state true
              navigate(targetPath, { replace: true });
              
              // Longer timeout to ensure transition completes before changing loading state
              setTimeout(() => {
                setIsLoading(false);
                setAuthInitialized(true);
              }, 300);
            } else {
              // For non-auth pages, just update the state
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
