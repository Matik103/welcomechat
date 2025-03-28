
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { getUserRole } from '@/services/authService';
import { useAuthInitialize } from '@/hooks/useAuthInitialize';
import { useAuthStateChange } from '@/hooks/useAuthStateChange';
import { useAuthCallback } from '@/hooks/useAuthCallback';
import { useAuthState } from '@/hooks/useAuthState';

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
  // Use a custom hook to manage auth state to ensure hooks are always called
  const {
    session,
    setSession,
    user,
    setUser,
    userRole,
    setUserRole,
    isLoading,
    setIsLoading,
    authInitialized,
    setAuthInitialized
  } = useAuthState();
  
  const location = useLocation();
  const isCallbackUrl = location.pathname.includes('/auth/callback');
  
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
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    session,
    user,
    userRole,
    isLoading,
    setIsLoading, // Expose setIsLoading to allow components to update loading state
    signOut
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export the provider as a named component to ensure proper naming in React DevTools
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

// Export the hook
export const useAuth = () => useContext(AuthContext);
