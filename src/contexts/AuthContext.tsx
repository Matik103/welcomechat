
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'client' | 'user' | null;

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  userRole: UserRole;
  clientId: string | null;
  refreshUserRole: () => Promise<void>; // Added the missing method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // New method to refresh user role
  const refreshUserRole = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('Error refreshing user role:', error);
        return;
      }
      
      const role = session.user.app_metadata.role || session.user.user_metadata.role;
      setUserRole(role);
      
      // Set clientId from user metadata
      if (role === 'client' && session.user.user_metadata.client_id) {
        setClientId(session.user.user_metadata.client_id);
      } else {
        setClientId(null);
      }
    } catch (error) {
      console.error('Error in refreshUserRole:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const role = session.user.app_metadata.role || session.user.user_metadata.role;
        setUserRole(role);
        
        // Set clientId from user metadata
        if (role === 'client' && session.user.user_metadata.client_id) {
          setClientId(session.user.user_metadata.client_id);
        } else {
          setClientId(null);
        }
      } else {
        setUserRole(null);
        setClientId(null);
      }

      setIsLoading(false);
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const role = session.user.app_metadata.role || session.user.user_metadata.role;
        setUserRole(role);
        
        // Set clientId from user metadata
        if (role === 'client' && session.user.user_metadata.client_id) {
          setClientId(session.user.user_metadata.client_id);
        } else {
          setClientId(null);
        }
      } else {
        setUserRole(null);
        setClientId(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.session?.user) {
        const role = data.session.user.app_metadata.role || data.session.user.user_metadata.role;
        setUserRole(role);
        
        // Set clientId from user metadata
        if (role === 'client' && data.session.user.user_metadata.client_id) {
          setClientId(data.session.user.user_metadata.client_id);
        } else {
          setClientId(null);
        }
      }

      return { data: data.session, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUserRole(null);
      setClientId(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signOut,
        userRole,
        clientId,
        refreshUserRole, // Added the method to the context value
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
