
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

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
          setUserRole('admin');
          setIsLoading(false);
          
          // Redirect to admin dashboard
          window.location.href = '/';
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
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
  }, [setSession, setUser, setUserRole, setIsLoading]);
};
