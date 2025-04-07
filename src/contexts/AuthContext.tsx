
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/auth';
import { getUserRole } from '@/services/authService';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  userId: string | null;
  clientId: string | null;
  userRole: UserRole;
  userClientId: string | null;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  session: null,
  signIn: async () => ({}),
  signOut: async () => {},
  loading: true,
  isLoading: true,
  error: null,
  signUp: async () => ({}),
  resetPassword: async () => ({}),
  updatePassword: async () => ({}),
  userId: null,
  clientId: null,
  userRole: null,
  userClientId: null,
  refreshUserRole: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userClientId, setUserClientId] = useState<string | null>(null);

  // Refresh user role function
  const refreshUserRole = async () => {
    if (!user?.id) return;
    
    try {
      const role = await getUserRole();
      setUserRole(role);
      return role;
    } catch (err) {
      console.error("Error refreshing user role:", err);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setIsAuthenticated(!!session);
        setUser(session?.user || null);
        setUserId(session?.user?.id || null);

        // Get user role if we have a session
        if (session?.user) {
          try {
            const role = await getUserRole();
            setUserRole(role);
          } catch (err) {
            console.error("Error getting user role:", err);
            setUserRole(null);
          }
        }

        // Fetch client ID if user is authenticated
        if (session?.user?.id) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('client_id')
              .eq('id', session.user.id)
              .single();

            if (profileError && !profileError.message.includes("does not exist")) {
              console.error("Error fetching client ID:", profileError);
              setError(profileError.message);
            } else if (profileData?.client_id) {
              setClientId(profileData.client_id);
              setUserClientId(profileData.client_id);
            }
          } catch (err: any) {
            console.error("Error in client ID fetch:", err);
          }
        } else {
          setClientId(null);
          setUserClientId(null);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      setSession(session);
      setUserId(session?.user?.id || null);

      // Get user role on auth state change
      if (session?.user) {
        try {
          const role = await getUserRole();
          setUserRole(role);
        } catch (err) {
          console.error("Error getting user role on auth change:", err);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }

      // Fetch client ID on auth state change
      if (session?.user?.id) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('client_id')
            .eq('id', session.user.id)
            .single();

          if (profileError && !profileError.message.includes("does not exist")) {
            console.error("Error fetching client ID on auth change:", profileError);
            setError(profileError.message);
            setClientId(null);
            setUserClientId(null);
          } else if (profileData?.client_id) {
            setClientId(profileData.client_id);
            setUserClientId(profileData.client_id);
          }
        } catch (err: any) {
          console.error("Error in client ID fetch on auth change:", err);
          setClientId(null);
          setUserClientId(null);
        }
      } else {
        setClientId(null);
        setUserClientId(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setIsLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setSession(null);
      setUserId(null);
      setClientId(null);
      setUserClientId(null);
      setUserRole(null);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    session,
    signIn,
    signOut,
    loading,
    isLoading,
    error,
    signUp,
    resetPassword,
    updatePassword,
    userId,
    clientId,
    userRole,
    userClientId,
    refreshUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
