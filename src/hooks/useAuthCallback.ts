
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';
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
    if (!isCallbackUrl) return;
    
    // Skip if already processed to avoid infinite loops
    const authCallbackProcessed = sessionStorage.getItem('auth_callback_processed') === 'true';
    if (authCallbackProcessed) {
      console.log('Auth callback already processed, skipping');
      return;
    }
    
    // Mark as processing
    sessionStorage.setItem('auth_callback_processing', 'true');
    
    const getSession = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session in callback:', error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Get role immediately to avoid flashing wrong content
          try {
            const role = await getUserRole();
            setUserRole(role);
            console.log('Set user role in callback:', role); // Debug log
            
            // Store role in session storage as a fallback
            if (role) {
              sessionStorage.setItem('user_role', role);
            }
          } catch (error) {
            console.error('Error getting user role in callback:', error);
          } finally {
            // Mark as completed regardless of outcome
            sessionStorage.setItem('auth_callback_processed', 'true');
            sessionStorage.removeItem('auth_callback_processing');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
          sessionStorage.setItem('auth_callback_processed', 'true');
          sessionStorage.removeItem('auth_callback_processing');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setIsLoading(false);
        sessionStorage.setItem('auth_callback_processed', 'true');
        sessionStorage.removeItem('auth_callback_processing');
      }
    };
    
    getSession();
  }, [isCallbackUrl, setSession, setUser, setUserRole, setIsLoading]);
};
