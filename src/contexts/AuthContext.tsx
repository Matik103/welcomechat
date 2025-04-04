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
  useSession,
  useSupabaseClient,
} from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  clientId: string | null; // Ensure this is defined
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
  const supabaseClient = useSupabaseClient();
  const session = useSession();
  const user = session?.user ?? null;
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
            setIsAdmin(false);
            setIsClient(false);
          } else {
            setIsAdmin(profile?.role === 'admin');
            setIsClient(profile?.role === 'client');
          }
        } else {
          setIsAdmin(false);
          setIsClient(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [user, supabaseClient]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
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
      await supabaseClient.auth.signOut();
      setIsAdmin(false);
      setIsClient(false);
      router.push('/');
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

  // Create the auth context value with clientId
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin,
    isClient,
    clientId
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
