
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
          sessionStorage.setItem('auth_callback_processed', 'true');
          sessionStorage.removeItem('auth_callback_processing');
          return;
        }
        
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Set a default role from metadata immediately to prevent UI hanging
          if (data.session.user?.user_metadata?.role) {
            const metadataRole = data.session.user.user_metadata.role;
            if (metadataRole === 'admin' || metadataRole === 'client') {
              setUserRole(metadataRole);
              console.log('Set initial user role from metadata:', metadataRole);
            }
          }
          
          // Get role in the background - don't block UI on this
          Promise.race([
            getUserRole().then(role => {
              setUserRole(role);
              console.log('Set user role in callback:', role);
              
              // Store role in session storage as a fallback
              if (role) {
                sessionStorage.setItem('user_role', role);
              }
            }),
            new Promise(resolve => setTimeout(() => {
              console.log('Role fetch in callback timed out, using default');
              setUserRole('admin'); // Default to admin to prevent UI hang
              resolve(null);
            }, 1000))
          ]).finally(() => {
            // Mark as completed after role fetch attempt
            sessionStorage.setItem('auth_callback_processed', 'true');
            sessionStorage.removeItem('auth_callback_processing');
            setIsLoading(false);
          });
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
    
    // Safety timeout to ensure we never get stuck
    const safetyTimeout = setTimeout(() => {
      if (sessionStorage.getItem('auth_callback_processing') === 'true') {
        console.log('Auth callback safety timeout reached');
        sessionStorage.setItem('auth_callback_processed', 'true');
        sessionStorage.removeItem('auth_callback_processing');
        setIsLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(safetyTimeout);
    
  }, [isCallbackUrl, setSession, setUser, setUserRole, setIsLoading]);
};
