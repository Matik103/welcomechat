
import { useState, useCallback, useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const focusHandled = useRef(false);
  const lastFocusTime = useRef(0);
  const lastSessionRestoreTime = useRef(0);

  // Handle window focus events - with improved debouncing
  useEffect(() => {
    const handleFocus = () => {
      // Prevent rapid re-focus handling by adding a time threshold
      const now = Date.now();
      if (now - lastFocusTime.current < 5000) {
        console.log('Focus event ignored - too soon after last focus');
        return;
      }
      
      lastFocusTime.current = now;
      
      // Skip if we've already restored auth state recently
      if (now - lastSessionRestoreTime.current < 30000) {
        console.log('Auth state restored recently, skipping focus handling');
        return;
      }
      
      console.log('Window focused - checking auth state');
      
      // Skip if we've already handled this focus event
      if (focusHandled.current) return;
      focusHandled.current = true;
      
      // Reset flag when focus is lost
      const handleBlur = () => {
        focusHandled.current = false;
        console.log('Window blurred - reset focus handling flag');
      };
      
      window.addEventListener('blur', handleBlur, { once: true });
      
      // Check if we have stored auth state
      const storedState = sessionStorage.getItem('auth_state');
      if (storedState) {
        try {
          const { session: storedSession, user: storedUser, userRole: storedRole, timestamp } = JSON.parse(storedState);
          // Only restore if the stored state is less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            console.log('Restoring auth state from session storage');
            setSession(storedSession);
            setUser(storedUser);
            setUserRole(storedRole);
            setIsLoading(false);
            
            lastSessionRestoreTime.current = Date.now();
            
            // Dispatch a custom event to notify the app that auth state has been restored
            // but only if we actually had state to restore
            if (storedSession && storedUser) {
              window.dispatchEvent(new CustomEvent('authStateRestored'));
            }
          } else {
            console.log('Stored auth state is too old, not restoring');
            sessionStorage.removeItem('auth_state');
          }
        } catch (error) {
          console.error('Error restoring auth state on focus:', error);
          sessionStorage.removeItem('auth_state');
        }
      }
      
      return () => window.removeEventListener('blur', handleBlur);
    };

    window.addEventListener('focus', handleFocus);
    
    // Initial check on mount - with a small delay to not clash with other initializations
    if (!session && !user) {
      setTimeout(() => {
        handleFocus();
      }, 100);
    }
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [session, user]);

  // Use useCallback to memoize the setter functions
  const setSessionCallback = useCallback((newSession: Session | null) => {
    setSession(newSession);
    // Update sessionStorage when session changes
    if (newSession && user && userRole) {
      const authState = {
        session: newSession,
        user,
        userRole,
        timestamp: Date.now()
      };
      sessionStorage.setItem('auth_state', JSON.stringify(authState));
      lastSessionRestoreTime.current = Date.now();
    }
  }, [user, userRole]);

  const setUserCallback = useCallback((newUser: User | null) => {
    setUser(newUser);
    // Update sessionStorage when user changes
    if (session && newUser && userRole) {
      const authState = {
        session,
        user: newUser,
        userRole,
        timestamp: Date.now()
      };
      sessionStorage.setItem('auth_state', JSON.stringify(authState));
      lastSessionRestoreTime.current = Date.now();
    }
  }, [session, userRole]);

  const setUserRoleCallback = useCallback((newRole: UserRole | null) => {
    setUserRole(newRole);
    // Update sessionStorage when role changes
    if (session && user && newRole) {
      const authState = {
        session,
        user,
        userRole: newRole,
        timestamp: Date.now()
      };
      sessionStorage.setItem('auth_state', JSON.stringify(authState));
      lastSessionRestoreTime.current = Date.now();
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
