
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { toast } from "sonner";

type AuthStateChangeProps = {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  determineUserRole: (user: User) => Promise<UserRole>;
};

export const useAuthStateChange = ({
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  determineUserRole
}: AuthStateChangeProps) => {
  useEffect(() => {
    let mounted = true;

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", currentSession?.user.email);
            
            if (!currentSession) {
              console.error("No session found in SIGNED_IN event");
              setIsLoading(false);
              return;
            }
            
            setSession(currentSession);
            setUser(currentSession.user);
            
            const provider = currentSession.user.app_metadata?.provider;
            const isGoogleSSO = provider === 'google';
            
            if (isGoogleSSO) {
              // Google SSO users are admins
              setUserRole('admin');
              setIsLoading(false);
              
              // Redirect to admin dashboard
              window.location.href = '/';
              return;
            } else {
              // Simplified role logic - all authenticated users are admins
              setUserRole('admin');
              setIsLoading(false);
              
              // Direct to admin dashboard
              window.location.href = '/';
              return;
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            if (mounted) {
              setSession(null);
              setUser(null);
              setUserRole(null);
              setIsLoading(false);
            }
          } else {
            // Handle other events
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setIsLoading, determineUserRole]);
};
