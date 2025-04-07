
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getUserRole, checkAndRefreshAuth } from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  userRole: 'admin' | 'client' | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshUserRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  
  // Function to refresh user role
  const refreshUserRole = async () => {
    console.log("Refreshing user role");
    if (user) {
      try {
        const role = await getUserRole();
        console.log("User role refreshed:", role);
        setUserRole(role);
        return role;
      } catch (err) {
        console.error("Error refreshing user role:", err);
        return null;
      }
    }
    return null;
  };

  // Handle auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Wait a moment before fetching the role to ensure auth is fully processed
          setTimeout(() => {
            refreshUserRole();
          }, 100);
        }
        
        if (event === 'SIGNED_OUT') {
          setUserRole(null);
        }
      }
    );

    // Check for existing session on initial load
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          try {
            console.log("User found in session, fetching role");
            const role = await getUserRole();
            console.log("User role determined:", role);
            setUserRole(role);
          } catch (error) {
            console.error("Error fetching user role:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();

    // Periodically check and refresh auth if needed (every 5 minutes)
    const authCheckInterval = setInterval(async () => {
      if (user) {
        const isValid = await checkAndRefreshAuth();
        if (!isValid) {
          console.warn("Auth token is invalid, signing out");
          await supabase.auth.signOut();
        }
      }
    }, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      clearInterval(authCheckInterval);
    };
  }, []);

  // Set a timeout to stop loading if auth initialization takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization timeout reached, forcing loading state to complete");
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  // Track user role changes
  useEffect(() => {
    if (authInitialized && user && !userRole) {
      console.log("Auth initialized but no role, fetching user role");
      refreshUserRole();
    }
  }, [authInitialized, user, userRole]);

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    userRole,
    session,
    isLoading,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
