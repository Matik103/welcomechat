
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { determineUserRole } from '@/utils/authUtils';
import { UserRole } from '@/types/app';
import { User, Session } from '@supabase/supabase-js';

interface AuthStateChangeProps {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
}

export default function useAuthStateChange({
  setSession,
  setUser,
  setUserRole
}: AuthStateChangeProps) {
  useEffect(() => {
    // Set up the auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          // Get the user from the session
          const user = session.user;
          setSession(session);
          setUser(user);
          
          if (user) {
            // Determine user role
            try {
              const role = await determineUserRole(user);
              setUserRole(role);
            } catch (err) {
              console.error('Error determining user role:', err);
              setUserRole('user'); // Default to user on error
            }
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // Reset auth state on sign out or user deletion
          setSession(null);
          setUser(null);
          setUserRole(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update session on token refresh
          setSession(session);
        }
      }
    );

    // Clean up the subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole]);
}
