
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/contexts/AuthContext';
import { getUserRole } from '@/services/authService';

interface UseAuthCallbackProps {
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthCallback = ({
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading
}: UseAuthCallbackProps) => {
  useEffect(() => {
    // Only run this if we're on the callback URL
    if (!isCallbackUrl) return;
    
    const handleAuthCallback = async () => {
      // Avoid processing the callback multiple times
      const processed = sessionStorage.getItem('auth_callback_processed');
      if (processed) return;
      
      setIsLoading(true);
      
      try {
        // Try to get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          return;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Get user role
          const role = await getUserRole();
          setUserRole(role);
          
          // Mark callback as processed to avoid duplicate processing
          sessionStorage.setItem('auth_callback_processed', 'true');
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [isCallbackUrl, setIsLoading, setSession, setUser, setUserRole]);
};
