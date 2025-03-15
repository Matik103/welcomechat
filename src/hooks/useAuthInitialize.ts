
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

    const initializeAuth = async () => {
      if (authInitialized && !isCallbackUrl) return;
      
      try {
        console.log("Initializing auth state");
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Session found during init:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Set initialized flag
          setAuthInitialized(true);
          
          // All authenticated users are admins
          setUserRole('admin');
          setIsLoading(false);
          
          const isAuthPage = location.pathname === '/auth';
          
          if (!isCallbackUrl && isAuthPage) {
            console.log(`Redirecting from auth page to admin dashboard`);
            window.location.href = '/';
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
              console.log("No session, redirecting to auth page");
              navigate('/auth', { replace: true });
            }
            
            setIsLoading(false);
            setAuthInitialized(true);
          }
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
          const isAuthPage = location.pathname.startsWith('/auth');
          if (!isAuthPage) {
            console.log("Error occurred, redirecting to auth page");
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
    isCallbackUrl,
    determineUserRole
  ]);
};
