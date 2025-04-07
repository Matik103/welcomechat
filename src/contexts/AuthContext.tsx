import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  userId: string | null;
  clientId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  session: null,
  signIn: async () => ({}),
  signOut: async () => {},
  loading: true,
  error: null,
  signUp: async () => ({}),
  resetPassword: async () => ({}),
  updatePassword: async () => ({}),
  userId: null,
  clientId: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setIsAuthenticated(!!session);
        setUser(session?.user || null);
        setUserId(session?.user?.id || null);

        // Fetch client ID if user is authenticated
        if (session?.user?.id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('client_id')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching client ID:", profileError);
            setError(profileError.message);
          } else {
            setClientId(profileData?.client_id || null);
          }
        } else {
          setClientId(null);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      setSession(session);
      setUserId(session?.user?.id || null);

      // Fetch client ID on auth state change
      if (session?.user?.id) {
        supabase
          .from('profiles')
          .select('client_id')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData, error: profileError }) => {
            if (profileError) {
              console.error("Error fetching client ID:", profileError);
              setError(profileError.message);
              setClientId(null);
            } else {
              setClientId(profileData?.client_id || null);
            }
          });
      } else {
        setClientId(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return { error };
      }
      return { data };
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return { error };
      }
      return { data };
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
      setUserId(null);
      setClientId(null);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        setError(error.message);
        return { error };
      }
      return { data };
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return { error };
      }
      return { data };
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    session,
    signIn,
    signOut,
    loading,
    error,
    signUp,
    resetPassword,
    updatePassword,
    userId,
    clientId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
