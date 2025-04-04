
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { getUserRole } from '@/services/authService';
import { useAuthInitialize } from '@/hooks/useAuthInitialize';
import { useAuthStateChange } from '@/hooks/useAuthStateChange';
import { useAuthCallback } from '@/hooks/useAuthCallback';
import { useAuthState } from '@/hooks/useAuthState';

// Define UserRole type
export type UserRole = 'admin' | 'client' | null;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  setIsLoading: () => {},
  signOut: async () => {}
});

// Define the provider component
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  // Create local state for auth
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const location = useLocation();
  const isCallbackUrl = location.pathname.includes('/auth/callback');

  // Persist auth state to sessionStorage on updates
  useEffect(() => {
    if (session && user && userRole) {
      console.log("Persisting auth state to session storage");
      sessionStorage.setItem('auth_state', JSON.stringify({
        session,
        user,
        userRole,
        timestamp: Date.now()
      }));
    }
  }, [session, user, userRole]);

  // Try to restore auth state from sessionStorage on mount
  useEffect(() => {
    if (!authInitialized && !isCallbackUrl && !user) {
      const storedState = sessionStorage.getItem('auth_state');
      if (storedState) {
        try {
          console.log("Attempting to restore auth state from session storage");
          const { session: storedSession, user: storedUser, userRole: storedRole, timestamp } = JSON.parse(storedState);
          // Only restore if the stored state is less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            console.log("Restoring auth state from session storage");
            setSession(storedSession);
            setUser(storedUser);
            setUserRole(storedRole);
            
            // Verify the session is still valid with Supabase
            supabase.auth.getSession().then(({ data, error }) => {
              if (error || !data.session) {
                console.warn("Restored session is invalid, clearing state");
                setSession(null);
                setUser(null);
                setUserRole(null);
                sessionStorage.removeItem('auth_state');
              } else {
                console.log("Session verified with Supabase");
              }
              setIsLoading(false);
            });
          } else {
            console.log("Stored auth state is too old, removing");
            sessionStorage.removeItem('auth_state');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error restoring auth state:', error);
          sessionStorage.removeItem('auth_state');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
      setAuthInitialized(true);
    }
  }, [authInitialized, isCallbackUrl, user, setIsLoading]);
  
  // Initialize auth - check for existing session
  useAuthInitialize({
    authInitialized,
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    setAuthInitialized
  });
  
  // Set up auth state change listener
  useAuthStateChange({
    setSession,
    setUser,
    setUserRole,
    setIsLoading
  });
  
  // Handle auth callback specifically
  useAuthCallback({
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading
  });
  
  // Automatic loading timeout - never get stuck in loading
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Auth loading timeout reached - forcing completion');
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, setIsLoading]);
  
  // Sign out handler
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserRole(null);
      // Clear any auth-related local storage
      sessionStorage.removeItem('auth_callback_processed');
      sessionStorage.removeItem('auth_callback_processing');
      sessionStorage.removeItem('user_role_set');
      sessionStorage.removeItem('auth_state');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    session,
    user,
    userRole,
    isLoading,
    setIsLoading,
    signOut
  }), [session, user, userRole, isLoading]);
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Export the provider as a named component to ensure proper naming in React DevTools
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

// Export the hook
export const useAuth = () => useContext(AuthContext);
