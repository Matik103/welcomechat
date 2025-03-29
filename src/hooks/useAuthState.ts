import { useState, useCallback, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Handle window focus events
  useEffect(() => {
    const handleFocus = () => {
      // Check if we have stored auth state
      const storedState = sessionStorage.getItem('auth_state');
      if (storedState) {
        try {
          const { session: storedSession, user: storedUser, userRole: storedRole, timestamp } = JSON.parse(storedState);
          // Only restore if the stored state is less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            setSession(storedSession);
            setUser(storedUser);
            setUserRole(storedRole);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error restoring auth state on focus:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Use useCallback to memoize the setter functions
  const setSessionCallback = useCallback((newSession: Session | null) => {
    setSession(newSession);
    // Update sessionStorage when session changes
    if (newSession && user && userRole) {
      sessionStorage.setItem('auth_state', JSON.stringify({
        session: newSession,
        user,
        userRole,
        timestamp: Date.now()
      }));
    }
  }, [user, userRole]);

  const setUserCallback = useCallback((newUser: User | null) => {
    setUser(newUser);
    // Update sessionStorage when user changes
    if (session && newUser && userRole) {
      sessionStorage.setItem('auth_state', JSON.stringify({
        session,
        user: newUser,
        userRole,
        timestamp: Date.now()
      }));
    }
  }, [session, userRole]);

  const setUserRoleCallback = useCallback((newRole: UserRole | null) => {
    setUserRole(newRole);
    // Update sessionStorage when role changes
    if (session && user && newRole) {
      sessionStorage.setItem('auth_state', JSON.stringify({
        session,
        user,
        userRole: newRole,
        timestamp: Date.now()
      }));
    }
  }, [session, user]);

  const setIsLoadingCallback = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setAuthInitializedCallback = useCallback((initialized: boolean) => {
    setAuthInitialized(initialized);
  }, []);

  return {
    session,
    setSession: setSessionCallback,
    user,
    setUser: setUserCallback,
    userRole,
    setUserRole: setUserRoleCallback,
    isLoading,
    setIsLoading: setIsLoadingCallback,
    authInitialized,
    setAuthInitialized: setAuthInitializedCallback
  };
}
