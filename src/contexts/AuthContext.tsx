
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useAuthInitialize } from '@/hooks/useAuthInitialize';
import { useAuthStateChange } from '@/hooks/useAuthStateChange';
import { useAuthCallback } from '@/hooks/useAuthCallback';

// Define UserRole type
export type UserRole = 'admin' | 'client' | null;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
  clientId: string | null; // Add clientId property
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  setIsLoading: () => {},
  signOut: async () => {},
  clientId: null, // Default value for clientId
});

// Define the provider component
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  // Create local state for auth
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [clientId, setClientId] = useState<string | null>(null); // Add state for clientId
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const location = useLocation();
  const isCallbackUrl = location.pathname.includes('/auth/callback');

  // Extract clientId from user metadata when user changes
  useEffect(() => {
    if (user && user.user_metadata) {
      // Try to get client_id from user metadata
      const metadataClientId = user.user_metadata.client_id;
      if (metadataClientId) {
        console.log("Found client_id in user metadata:", metadataClientId);
        setClientId(metadataClientId);
      }
    }
  }, [user]);

  // Persist auth state to sessionStorage on updates
  useEffect(() => {
    if (session && user && userRole) {
      console.log("Persisting auth state to session storage");
      sessionStorage.setItem('auth_state', JSON.stringify({
        session,
        user,
        userRole,
        clientId, // Include clientId in stored state
        timestamp: Date.now()
      }));
    }
  }, [session, user, userRole, clientId]);

  // Try to restore auth state from sessionStorage on mount
  useEffect(() => {
    if (!authInitialized && !isCallbackUrl && !user) {
      const storedState = sessionStorage.getItem('auth_state');
      if (storedState) {
        try {
          console.log("Attempting to restore auth state from session storage");
          const { session: storedSession, user: storedUser, userRole: storedRole, clientId: storedClientId, timestamp } = JSON.parse(storedState);
          // Only restore if the stored state is less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            console.log("Restoring auth state from session storage");
            setSession(storedSession);
            setUser(storedUser);
            setUserRole(storedRole);
            setClientId(storedClientId); // Restore clientId
            
            // Verify the session is still valid with Supabase
            supabase.auth.getSession().then(({ data, error }) => {
              if (error || !data.session) {
                console.warn("Restored session is invalid, clearing state");
                setSession(null);
                setUser(null);
                setUserRole(null);
                setClientId(null); // Clear clientId
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
      }, 3000); // Reduced from 5000ms to 3000ms for faster experience
      
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
      setClientId(null); // Clear clientId on sign out
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
    signOut,
    clientId  // Include clientId in the context value
  }), [session, user, userRole, isLoading, clientId]);
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Export the provider as a named component to ensure proper naming in React DevTools
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

// Export the hook
export const useAuth = () => useContext(AuthContext);
