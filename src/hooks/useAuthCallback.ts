
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isClientInDatabase } from "@/utils/authUtils";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

type AuthCallbackProps = {
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  determineUserRole: (user: User) => Promise<UserRole>;
};

export const useAuthCallback = ({
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  determineUserRole
}: AuthCallbackProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isCallbackUrl) {
      const handleCallback = async () => {
        try {
          // Get the session from the URL
          const { data: { session: callbackSession }, error: sessionError } = 
            await supabase.auth.getSession();
            
          if (sessionError || !callbackSession) {
            console.error("Error getting session from callback URL:", sessionError);
            toast.error("Authentication failed. Please try again.");
            navigate('/auth', { replace: true });
            return;
          }
          
          const user = callbackSession.user;
          
          // Check if this is a Google login and if the user is a client
          const provider = user?.app_metadata?.provider;
          const isGoogleLogin = provider === 'google';
          
          if (isGoogleLogin && user.email) {
            // Check if this email belongs to a client
            const isClient = await isClientInDatabase(user.email);
            
            if (isClient) {
              // If client trying to use Google SSO, sign them out
              console.log("Client attempted to use Google SSO, signing out:", user.email);
              await supabase.auth.signOut();
              toast.error("Clients must use email and password to sign in. Google sign-in is only available for administrators.");
              navigate('/auth', { replace: true });
              return;
            }
            
            // Admin user with Google SSO is allowed to proceed
            console.log("Admin authenticated with Google SSO:", user.email);
            setSession(callbackSession);
            setUser(user);
            
            // Get user role and set it
            const role = await determineUserRole(user);
            setUserRole(role);
            
            console.log("Setting role for Google SSO user:", role);
            setIsLoading(false);
            navigate('/', { replace: true });
          } else {
            // Non-Google login, proceed normally
            setSession(callbackSession);
            setUser(user);
            
            // Get user role and set it
            const role = await determineUserRole(user);
            setUserRole(role);
            
            console.log("Setting role for regular user:", role);
            setIsLoading(false);
            
            // Redirect based on role
            if (role === 'client') {
              navigate('/client/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error handling auth callback:", error);
          toast.error("Authentication failed. Please try again.");
          navigate('/auth', { replace: true });
        } finally {
          setIsLoading(false);
        }
      };
      
      handleCallback();
    }
  }, [isCallbackUrl, navigate, setSession, setUser, setUserRole, setIsLoading, determineUserRole]);
};
