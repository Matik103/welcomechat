
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
          
          // Don't override role if it's already set (from callback handler)
          // This preserves the admin role set for Google SSO users
          if (!sessionStorage.getItem('user_role_set')) {
            // For non-SSO users, determine role from database
            const userRole = await determineUserRole(currentSession.user);
            setUserRole(userRole);
            sessionStorage.setItem('user_role_set', userRole);
          }
          
          // Only redirect if we're on the auth page
          const isAuthPage = location.pathname === '/auth';
          if (isAuthPage) {
            // Get current role from storage or use admin as default (consistent with SSO behavior)
            const role = sessionStorage.getItem('user_role_set') || 'admin';
            // Determine where to navigate based on role
            const targetPath = role === 'admin' ? '/' : '/client/dashboard';
            navigate(targetPath, { replace: true });
            setTimeout(() => {
              setIsLoading(false);
            }, 300);
          } else {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          sessionStorage.removeItem('user_role_set');
          
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
