
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { determineUserRole, isGoogleSSOUser } from "@/utils/authUtils";

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
          const isGoogleAuth = isGoogleSSOUser(currentSession.user);
          console.log("Is Google Auth?", isGoogleAuth);
          
          if (isGoogleAuth) {
            // Google SSO users are always assigned admin role
            console.log("Google SSO login detected - assigning admin role");
            setUserRole('admin');
            
            // Check if user is on auth page
            const isAuthPage = location.pathname === '/auth';
            const isClientRoute = location.pathname.startsWith('/client');
            
            if (isClientRoute || isAuthPage) {
              // For both client routes and auth page, redirect to admin dashboard
              console.log("Redirecting Google SSO user to admin dashboard");
              navigate('/', { replace: true });
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
            
            // Only redirect if we're on the auth page
            const isAuthPage = location.pathname === '/auth';
            if (isAuthPage) {
              // Determine where to navigate based on role
              const targetPath = userRole === 'admin' ? '/' : '/client/dashboard';
              navigate(targetPath, { replace: true });
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
