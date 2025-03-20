
import { useCallback } from 'react';
import { UserRole } from '@/types/app';
import { User, Session } from '@supabase/supabase-js';

interface AuthCallbackProps {
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function useAuthCallback({
  setSession,
  setUser,
  setUserRole,
  setIsLoading
}: AuthCallbackProps) {
  /**
   * Process authentication result
   */
  const processAuth = useCallback(
    async (session: Session | null, user: User | null, role: UserRole | null) => {
      try {
        setIsLoading(true);
        setSession(session);
        setUser(user);
        setUserRole(role);
      } catch (error) {
        console.error('Error in processAuth:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, setUser, setUserRole, setIsLoading]
  );

  /**
   * Reset authentication state
   */
  const resetAuth = useCallback(() => {
    setSession(null);
    setUser(null);
    setUserRole(null);
  }, [setSession, setUser, setUserRole]);

  return { processAuth, resetAuth };
}
