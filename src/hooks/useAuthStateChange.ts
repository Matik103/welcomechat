
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { determineUserRole } from "@/utils/authUtils";

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

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("User signed in or token refreshed");
          
          if (!currentSession) {
            console.error("No session found in SIGNED_IN event");
            setIsLoading(false);
            return;
          }
          
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check if Google SSO authentication
          const isGoogleAuth = currentSession.user?.app_metadata?.provider === 'google';
          console.log("Auth provider:", currentSession.user?.app_metadata?.provider);
          
          if (isGoogleAuth) {
            // Google SSO users are always assigned admin role
            console.log("Google SSO login detected in state change, assigning admin role");
            setUserRole('admin');
            
            // Only redirect if we're on the auth page to prevent refresh loops
            const isAuthPage = location.pathname === '/auth';
            if (isAuthPage) {
              console.log("Redirecting Google user to admin dashboard from state change");
              // Always direct Google SSO users to admin dashboard
              navigate('/', { replace: true });
              
              // Maintain loading state for longer to ensure no flash of login screen
              setTimeout(() => {
                setIsLoading(false);
              }, 300);
            } else {
              setIsLoading(false);
            }
          } else {
            // For email/password users, determine role from database
            const userRole = await determineUserRole(currentSession.user);
            setUserRole(userRole);
            
            // Only redirect if we're on the auth page to prevent refresh loops
            const isAuthPage = location.pathname === '/auth';
            if (isAuthPage) {
              // Determine where to navigate based on role
              const targetPath = userRole === 'admin' ? '/' : '/client/dashboard';
              console.log("Redirecting to:", targetPath);
              
              // Start navigation before changing loading state
              navigate(targetPath, { replace: true });
              
              // Maintain loading state for longer to ensure no flash of login screen
              setTimeout(() => {
                setIsLoading(false);
              }, 300);
            } else {
              setIsLoading(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          
          // Only redirect to auth page if not already there
          const isAuthPage = location.pathname === '/auth';
          if (!isAuthPage) {
            navigate('/auth', { replace: true });
          }
        } else {
          // Handle other events
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setIsLoading, navigate, location.pathname]);
};
