
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

export type UserRole = 'admin' | 'client' | null;

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  userId: string | null;
  userClientId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
  refreshUserRole: async () => {},
  userId: null,
  userClientId: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userClientId, setUserClientId] = useState<string | null>(null);

  const refreshUserRole = async () => {
    try {
      if (!user) {
        setUserRole(null);
        setUserId(null);
        setUserClientId(null);
        return;
      }

      // Get user role from user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setUserId(null);
        setUserClientId(null);
        return;
      }

      setUserRole(data.role || null);
      setUserId(user.id || null);
      setUserClientId(data.client_id || null);
      
      // Store in session storage for quick access on page refreshes
      sessionStorage.setItem('userRole', data.role || '');
      sessionStorage.setItem('userId', user.id || '');
      sessionStorage.setItem('userClientId', data.client_id || '');
    } catch (error) {
      console.error('Error in refreshUserRole:', error);
      setUserRole(null);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await refreshUserRole();
        } else {
          setUserRole(null);
          setUserId(null);
          setUserClientId(null);
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('userClientId');
        }
        
        setIsLoading(false);
      }
    );

    // Initial session check
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Try to recover from session storage first (for faster UI display)
        const storedRole = sessionStorage.getItem('userRole');
        const storedUserId = sessionStorage.getItem('userId');
        const storedClientId = sessionStorage.getItem('userClientId');
        
        if (storedRole) {
          setUserRole(storedRole as UserRole);
          setUserId(storedUserId);
          setUserClientId(storedClientId);
        }
        
        // Then check actual auth state
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await refreshUserRole();
        } else {
          setUserRole(null);
          setUserId(null);
          setUserClientId(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserRole(null);
      setUserId(null);
      setUserClientId(null);
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userClientId');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    signOut,
    refreshUserRole,
    userId,
    userClientId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
