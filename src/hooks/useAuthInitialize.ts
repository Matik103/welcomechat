
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { isClientInDatabase } from "@/utils/authUtils";

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
          
          // Check if Google SSO user
          const isGoogleUser = currentSession.user.app_metadata?.provider === 'google';
          
          if (isGoogleUser) {
            // Check if Google user's email is in clients table
            const isClientEmail = await isClientInDatabase(currentSession.user.email || '');
            
            if (isClientEmail) {
              console.error("Google SSO user's email exists in clients table");
              // Sign them out
              await supabase.auth.signOut();
              // Clear session data
              setSession(null);
              setUser(null);
              setUserRole(null);
              setIsLoading(false);
              
              if (!isCallbackUrl) {
                navigate('/auth', { replace: true });
              }
              
              return;
            }
            
            // Google SSO users are always admins
            setUserRole('admin');
            setIsLoading(false);
            
            if (!isCallbackUrl && location.pathname !== '/') {
              console.log("Redirecting Google SSO user to admin dashboard");
              // Use direct window location for clean redirect
              window.location.href = '/';
              return;
            }
          } else {
            // Regular users get role based on email in clients table
            const role = await determineUserRole(currentSession.user);
            setUserRole(role);
            setIsLoading(false);
            
            const isAuthPage = location.pathname === '/auth';
            
            if (!isCallbackUrl && isAuthPage) {
              console.log(`Redirecting ${role} from auth page to appropriate dashboard`);
              window.location.href = role === 'admin' ? '/' : '/client/dashboard';
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
