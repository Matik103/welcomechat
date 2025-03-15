
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

type AuthInitializeProps = {
  authInitialized: boolean;
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
  determineUserRole: (user: User) => Promise<UserRole>;
};

export const useAuthInitialize = ({
  authInitialized,
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  setAuthInitialized,
  determineUserRole
}: AuthInitializeProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      if (authInitialized && !isCallbackUrl) return;
      
      try {
        setIsLoading(true);
        console.log("Initializing auth state");
        
        // Set a timeout to prevent infinite loading
        initTimeout = setTimeout(() => {
          if (mounted && setIsLoading) {
            console.log("Auth initialization timed out, resetting loading state");
            setIsLoading(false);
            setAuthInitialized(true);
            
            // If we're stuck on a non-auth page, redirect to auth
            const isAuthPage = location.pathname === '/auth';
            if (!isAuthPage) {
              navigate('/auth', { replace: true });
            }
          }
        }, 5000);
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Session found during init:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Set initialized flag
          setAuthInitialized(true);
          
          // Check if Google SSO user
          const isGoogleUser = currentSession.user.app_metadata?.provider === 'google';
          
          if (isGoogleUser) {
            // Google SSO users are always admins and go to admin dashboard
            setUserRole('admin');
            setIsLoading(false);
            
            if (!isCallbackUrl) {
              navigate('/', { replace: true });
            }
          } else {
            // Regular users get role based on email in clients table
            const role = await determineUserRole(currentSession.user);
            setUserRole(role);
            console.log("User role determined:", role);
            
            // Reset loading state
            setIsLoading(false);
            
            const isAuthPage = location.pathname === '/auth';
            
            if (!isCallbackUrl && !isAuthPage) {
              if (role === 'client') {
                navigate('/client/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            } else if (isAuthPage) {
              if (role === 'client') {
                navigate('/client/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }
          }
        } else {
          console.log("No active session found during init");
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            
            const isAuthRelatedPage = location.pathname.startsWith('/auth') || 
                                    location.pathname.startsWith('/client/setup');
              
            if (!isAuthRelatedPage) {
              navigate('/auth', { replace: true });
            }
            
            setIsLoading(false);
            setAuthInitialized(true);
          }
        }
        
        // Clear timeout since we've completed initialization
        clearTimeout(initTimeout);
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          setAuthInitialized(true);
          
          // Redirect to auth page on error
          const isAuthPage = location.pathname.startsWith('/auth');
          if (!isAuthPage) {
            navigate('/auth', { replace: true });
          }
        }
        
        // Clear timeout on error
        clearTimeout(initTimeout);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
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
    isCallbackUrl,
    determineUserRole
  ]);
};
