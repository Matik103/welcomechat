
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/contexts/AuthContext";
import { getUserRole } from "@/services/authService";

interface UseAuthInitializeProps {
  authInitialized: boolean;
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole) => void;
  setIsLoading: (isLoading: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
}

export const useAuthInitialize = ({
  authInitialized,
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  setAuthInitialized
}: UseAuthInitializeProps) => {
  // The error happens here - we need to ensure the hook is used properly
  useEffect(() => {
    // Only run this effect when the component mounts
    // Skip initialization if we're on the callback URL or if already initialized
    if (isCallbackUrl || authInitialized) return;
    
    // Create a race condition between the auth initialization and a timeout
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Get user role with a timeout to prevent hanging
          const rolePromise = getUserRole();
          
          // Race between role fetch and timeout - use a shorter timeout (1.5 sec)
          try {
            const role = await Promise.race([
              rolePromise,
              new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Role fetch timeout')), 1500)
              )
            ]);
            
            setUserRole(role);
            console.log("Role set:", role);
          } catch (timeoutErr) {
            console.warn("Role fetch timed out, using default:", timeoutErr);
            // Extract role from user metadata as a fallback
            const metadataRole = data.session.user?.user_metadata?.role;
            if (metadataRole === 'admin' || metadataRole === 'client') {
              setUserRole(metadataRole);
              console.log("Using metadata role:", metadataRole);
            } else {
              // Default to admin to prevent hanging UI
              setUserRole('admin');
              console.log("Defaulting to admin role due to timeout");
            }
          }
        }
      } catch (err) {
        console.error("Error in auth initialization:", err);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Add a safety timeout that will complete initialization after 2 seconds (shorter than before)
    const safetyTimeout = setTimeout(() => {
      if (!authInitialized) {
        console.log("Safety timeout reached - forcing auth initialization completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 2000);
    
    return () => clearTimeout(safetyTimeout);
    
  }, [
    authInitialized,
    isCallbackUrl, 
    setAuthInitialized, 
    setIsLoading, 
    setSession, 
    setUser, 
    setUserRole
  ]);
};
