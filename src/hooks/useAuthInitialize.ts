
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/contexts/AuthContext';
import { getUserRole } from '@/services/authService';

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
          return;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Get user role
          const role = await getUserRole();
          setUserRole(role);
        }
      } catch (err) {
        console.error("Error in auth initialization:", err);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
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
