
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import {
  Session,
  User,
} from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Define UserRole type
export type UserRole = 'admin' | 'client' | null;

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  clientId: string | null;
  userRole: UserRole; // Add userRole explicitly to the interface
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
            setIsAdmin(false);
            setIsClient(false);
            setUserRole(null);
          } else {
            const role = profile?.role as UserRole;
            setIsAdmin(role === 'admin');
            setIsClient(role === 'client');
            setUserRole(role);
          }
        } else {
          setIsAdmin(false);
          setIsClient(false);
          setUserRole(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [user, supabase]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsClient(false);
      setUserRole(null);
      navigate('/');
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Make sure clientId is properly set
  const clientId = useMemo(() => {
    if (isClient && user) {
      return user.id;
    }
    return null;
  }, [isClient, user]);

  // Create the auth context value with clientId and userRole
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin,
    isClient,
    clientId,
    userRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
