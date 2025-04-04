import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: any;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserRole: (userId: string) => Promise<UserRole>;
};

type UserRole = 'admin' | 'agent' | 'client' | 'unknown';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    setUser(session?.data?.session?.user || null);
    setIsLoading(false);
  }, []);

  const signIn = async (email: string) => {
    try {
      await supabase.auth.signInWithOtp({ email });
      alert('Check your email for the magic link to sign in.');
    } catch (error) {
      console.error('Error signing in:', error);
      alert('An error occurred while signing in.');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update the getUserRole function to handle the case where role is not found
  const getUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return 'unknown';
      }

      return data?.role || 'unknown';
    } catch (error) {
      console.error('Exception in getUserRole:', error);
      return 'unknown';
    }
  };

  const value: AuthContextType = { user, isLoading, signIn, signOut, getUserRole };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
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
