import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { reactivateClientAccount } from '@/utils/authUtils';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user || null);
        
        // Extract user role from app_metadata
        const role = session?.user?.app_metadata?.role || null;
        setUserRole(role as string || null);
        
        console.log("Initial session data:", session);
        console.log("Initial user role:", role);
        
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth state change event:", event);
      console.log("New session:", session);

      setSession(session);
      setUser(session?.user || null);
      
      // Extract user role from app_metadata
      const role = session?.user?.app_metadata?.role || null;
      setUserRole(role as string || null);
      
      console.log("Updated user role:", role);

      // Check if this is a sign-in event and reactivate account if needed
      if (event === 'SIGNED_IN' && session?.user?.email) {
        try {
          await reactivateClientAccount(session.user.email);
        } catch (error) {
          console.error("Error checking for account reactivation:", error);
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log("Navigating to /auth on sign out");
        navigate('/auth');
      }
    });
  }, [navigate]);

  const signIn = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('Check your email for the magic link to sign in.');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      console.log("Signed out successfully");
      navigate('/auth');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    signIn,
    signOut,
    isLoading,
    userRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
