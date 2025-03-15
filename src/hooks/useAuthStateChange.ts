
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

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
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        setIsLoading(true);

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", currentSession?.user.email);
            
            if (!currentSession) {
              console.error("No session found in SIGNED_IN event");
              setIsLoading(false);
              navigate('/auth', { replace: true });
              return;
            }
            
            setSession(currentSession);
            setUser(currentSession.user);
            
            // Google SSO users always go to admin dashboard
            const provider = currentSession.user.app_metadata?.provider;
            const isGoogleSSO = provider === 'google';
            
            if (isGoogleSSO) {
              // Google SSO users are always admins
              setUserRole('admin');
              console.log("Google SSO user, redirecting to admin dashboard");
              
              // Reset loading before redirect
              setIsLoading(false);
              
              // Use a timeout to ensure state updates before navigation
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            } else {
              // Get user role for non-Google users
              const role = await determineUserRole(currentSession.user);
              setUserRole(role);
              console.log("User role set:", role);
              
              // Reset loading before redirect
              setIsLoading(false);
              
              if (role === 'client') {
                navigate('/client/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            if (mounted) {
              setSession(null);
              setUser(null);
              setUserRole(null);
              setIsLoading(false);
              
              navigate('/auth', { replace: true });
            }
          } else if (event === 'USER_UPDATED' && currentSession && mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            setIsLoading(false);
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
            
            // Redirect to auth page on error
            navigate('/auth', { replace: true });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setSession, setUser, setUserRole, setIsLoading, determineUserRole]);
};
