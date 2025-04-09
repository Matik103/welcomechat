
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
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
  clientId: string | null;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  setIsLoading: () => {},
  signOut: async () => {},
  clientId: null,
});

// Define the provider component
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  // Create local state for auth
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [clientId, setClientId] = useState<string | null>(null);
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

  // Handle auth callback specifically
  useAuthCallback({
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading
  });
  
  // Set up auth state change listener - must be set up before initialize
  useAuthStateChange({
    setSession,
    setUser,
    setUserRole,
    setIsLoading
  });
  
  // Initialize auth - check for existing session (after setting up state change listener)
  useAuthInitialize({
    authInitialized,
    isCallbackUrl,
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    setAuthInitialized
  });
  
  // A stronger safety timeout - never get stuck in loading for more than 2 seconds, no matter what
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Auth loading hard timeout reached - forcing completion');
        setIsLoading(false);
        // If we have a user but no role, assign a default role to prevent UI issues
        if (user && !userRole) {
          console.log('Setting default role to admin due to timeout');
          setUserRole('admin');
        }
      }, 2000); // Reduced from 3000ms to 2000ms
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, userRole, setIsLoading]);
  
  // Sign out handler
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserRole(null);
      setClientId(null);
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
    clientId
  }), [session, user, userRole, isLoading, clientId]);
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Export the provider as a named component to ensure proper naming in React DevTools
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

// Export the hook
export const useAuth = () => useContext(AuthContext);
