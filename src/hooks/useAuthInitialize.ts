
import { useEffect } from 'react';
import { determineUserRole } from '@/utils/authUtils';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/app';
import { User, Session } from '@supabase/supabase-js';

interface AuthInitializeProps {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
}

export default function useAuthInitialize({
  setSession,
  setUser,
  setUserRole,
  setIsLoading,
  setAuthInitialized
}: AuthInitializeProps) {
  useEffect(() => {
    // Define the auth initialization function
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        if (session) {
          // If we have a session, get the user
          const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error getting user:', userError);
            throw userError;
          }
          
          if (currentUser) {
            // Set the session and user
            setSession(session);
            setUser(currentUser);
            
            // Determine user role
            let role = await determineUserRole(currentUser);
            setUserRole(role);
          } else {
            // No valid user, reset auth state
            setSession(null);
            setUser(null);
            setUserRole(null);
          }
        } else {
          // No session, reset auth state
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Reset on error
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    // Run the initialize function
    initializeAuth();
  }, [setSession, setUser, setUserRole, setIsLoading, setAuthInitialized]);
}
