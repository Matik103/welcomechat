
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
          
          // Check if we have a stored role
          const storedRole = sessionStorage.getItem('user_role_set');
          let determinedUserRole: UserRole;
          
          if (storedRole && (storedRole === 'admin' || storedRole === 'client')) {
            setUserRole(storedRole as UserRole);
            determinedUserRole = storedRole as UserRole;
          } else {
            // Determine role from database
            determinedUserRole = await determineUserRole(currentSession.user);
            setUserRole(determinedUserRole);
            sessionStorage.setItem('user_role_set', determinedUserRole);
          }
          
          // Only redirect if we're on the auth page
          const isAuthPage = location.pathname === '/auth';
          if (isAuthPage) {
            // Determine where to navigate based on role
            const targetPath = (determinedUserRole === 'client' || storedRole === 'client') 
              ? '/client/dashboard' 
              : '/';
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
