
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
        // Try to get cached role first from session storage
        const cachedAuthState = sessionStorage.getItem('auth_state_cache');
        if (cachedAuthState) {
          try {
            const parsed = JSON.parse(cachedAuthState);
            // If cache is recent (less than 1 minute old), use it
            if (parsed.timeStamp && (Date.now() - parsed.timeStamp < 60000)) {
              console.log("Using cached auth state:", parsed);
              // If we have a cached role, set it initially
              if (parsed.role === 'admin' || parsed.role === 'client') {
                setUserRole(parsed.role);
                console.log("Using cached role:", parsed.role);
              }
            }
          } catch (e) {
            console.error("Error parsing cached auth state:", e);
          }
        }
        
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
          
          // Extract role from metadata as a fast initial value
          const metadataRole = data.session.user?.user_metadata?.role;
          if (metadataRole === 'admin' || metadataRole === 'client') {
            setUserRole(metadataRole);
            console.log("Using metadata role:", metadataRole);
          }
          
          // Fetch the role separately with a timeout
          try {
            const rolePromise = Promise.race([
              getUserRole(),
              new Promise<UserRole>(resolve => {
                setTimeout(() => {
                  console.log("Role fetch timeout reached");
                  // Default to role from metadata if available, otherwise admin
                  if (metadataRole === 'admin' || metadataRole === 'client') {
                    resolve(metadataRole);
                  } else {
                    resolve('admin');
                  }
                }, 800); // 800ms timeout
              })
            ]);
            
            const role = await rolePromise;
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
    
    // Add a safety timeout that will complete initialization after 1.2 seconds (shortened from before)
    const safetyTimeout = setTimeout(() => {
      if (!authInitialized) {
        console.log("Safety timeout reached - forcing auth initialization completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 1200);
    
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
