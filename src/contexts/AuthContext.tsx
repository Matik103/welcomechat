
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { UserRole } from '@/types/app';
import useAuthInitialize from '@/hooks/useAuthInitialize';
import useAuthStateChange from '@/hooks/useAuthStateChange';
import { useAuthSafetyTimeout } from '@/hooks/useAuthSafetyTimeout';

export interface AuthState {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  authInitialized: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (loading: boolean) => void;
  setAuthInitialized: (initialized: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Initialize auth state
  useAuthInitialize({ 
    setSession, 
    setUser, 
    setUserRole, 
    setIsLoading, 
    setAuthInitialized 
  });

  // Handle auth state changes
  useAuthStateChange({ 
    setSession, 
    setUser, 
    setUserRole 
  });

  // Get the current URL path to check if we're on an auth page
  const isAuthPage = window.location.pathname.includes('/auth') || 
                      window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/register');

  // Safety timeout for auth initialization
  useAuthSafetyTimeout({ 
    isLoading, 
    setIsLoading, 
    isAuthPage,
    session
  });

  // Login function
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Alias for login
  const signIn = login;

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
  };

  // Alias for logout
  const signOut = logout;

  // Signup function
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    authInitialized,
    login,
    signIn,
    logout,
    signOut,
    signUp,
    setSession,
    setUser,
    setUserRole,
    setIsLoading,
    setAuthInitialized
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
