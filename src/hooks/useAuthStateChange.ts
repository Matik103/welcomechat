
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth'; // Import from types/auth instead
import { getUserRole } from '@/services/authService';

interface UseAuthStateChangeProps {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStateChange = ({
  setSession,
  setUser,
  setUserRole,
  setIsLoading
}: UseAuthStateChangeProps) => {
  useEffect(() => {
    const handleAuthChange = async (event: string, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoading(true);
        setSession(session);
        setUser(session.user);
        
        // Get user role
        const role = await getUserRole();
        setUserRole(role);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
      }
    };
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setUser, setUserRole]);
};
