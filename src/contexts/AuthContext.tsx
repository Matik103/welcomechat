
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Export the UserRole type so it can be imported by other modules
export type UserRole = 'admin' | 'agent' | 'client' | 'unknown';

type AuthContextType = {
  user: any;
  isLoading: boolean;
  session: any; // Added session property
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserRole: (userId: string) => Promise<UserRole>;
  userRole: UserRole;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('unknown');
  const [session, setSession] = useState<any>(null); // Added session state

  useEffect(() => {
    // Initialize session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setSession(data.session || null); // Set session state
        
        if (data.session?.user) {
          const role = await getUserRole(data.session.user.id);
          setUserRole(role);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setUser(currentSession?.user || null);
        setSession(currentSession || null); // Update session state on auth change
        
        if (currentSession?.user) {
          const role = await getUserRole(currentSession.user.id);
          setUserRole(role);
        } else {
          setUserRole('unknown');
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
      setUserRole('unknown');
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

      return (data?.role as UserRole) || 'unknown';
    } catch (error) {
      console.error('Exception in getUserRole:', error);
      return 'unknown';
    }
  };

  const value: AuthContextType = { 
    user, 
    isLoading, 
    session, // Add session to context value
    signIn, 
    signOut, 
    getUserRole,
    userRole 
  };

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
