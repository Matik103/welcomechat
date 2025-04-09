
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
  useEffect(() => {
    // Skip initialization if we're on the callback URL or if already initialized
    if (isCallbackUrl || authInitialized) return;
    
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
          
          // Instead of racing promises, use a simpler approach
          try {
            // Set a reasonable timeout for role fetch
            const rolePromise = new Promise<UserRole>(async (resolve) => {
              try {
                const role = await getUserRole();
                resolve(role);
              } catch (err) {
                console.warn("Error fetching role:", err);
                // Extract role from user metadata as a fallback
                const metadataRole = data.session.user?.user_metadata?.role;
                if (metadataRole === 'admin' || metadataRole === 'client') {
                  resolve(metadataRole);
                } else {
                  // Default to admin role to prevent hanging UI
                  resolve('admin');
                }
              }
            });
            
            // Add a time limit for role fetching (1 second)
            const role = await Promise.race([
              rolePromise,
              new Promise<UserRole>((resolve) => setTimeout(() => {
                console.log("Role fetch timeout reached, defaulting to admin");
                resolve('admin');
              }, 1000))
            ]);
            
            setUserRole(role);
            console.log("Role set to:", role);
          } catch (err) {
            console.error("Error setting user role:", err);
            // Default to admin as fallback
            setUserRole('admin');
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
    
    // Add a safety timeout that will complete initialization after 1.5 seconds (shortened from before)
    const safetyTimeout = setTimeout(() => {
      if (!authInitialized) {
        console.log("Safety timeout reached - forcing auth initialization completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 1500);
    
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
