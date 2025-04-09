
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/contexts/AuthContext';
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            const role = await getUserRole();
            setUserRole(role);
            console.log('Role set to:', role);
          } catch (error) {
            console.error('Error getting user role:', error);
          }
        } else {
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setIsLoading]);
};
