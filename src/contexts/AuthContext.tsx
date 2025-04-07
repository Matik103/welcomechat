
import { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CACHE_STALE_TIME } from '@/config/env';
import { refreshSupabaseSession } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'client' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<UserRole>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  refreshUserRole: async () => null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRoleCheck, setLastRoleCheck] = useState<number>(0);
  const navigate = useNavigate();

  // Check user role based on metadata or database
  const checkUserRole = useCallback(async (user: User | null): Promise<UserRole> => {
    if (!user) {
      console.log("No user to check role for");
      return null;
    }

    try {
      // First check if role is in user metadata (fastest)
      if (user.user_metadata && user.user_metadata.role) {
        console.info("Role found in user metadata:", user.user_metadata.role);
        return user.user_metadata.role as UserRole;
      }

      // If not in metadata, check database role
      console.info("Getting user role from database...");
      
      // Check if user is admin
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('check_user_role', { allowed_roles: ['admin'] });

      if (adminError) {
        console.error("Error checking admin role:", adminError);
        throw adminError;
      }

      if (isAdmin === true) {
        console.info("User is admin");
        return 'admin';
      }

      // Check if user is client
      const { data: isClient, error: clientError } = await supabase
        .rpc('check_user_role', { allowed_roles: ['client'] });

      if (clientError) {
        console.error("Error checking client role:", clientError);
        throw clientError;
      }

      if (isClient === true) {
        console.info("User is client");
        return 'client';
      }

      console.info("User has no specific role");
      return null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  }, []);

  const refreshUserRole = useCallback(async (): Promise<UserRole> => {
    console.log("Getting user role...");
    
    try {
      // Get current user to ensure it's up to date
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log("No user found during role refresh");
        setUserRole(null);
        return null;
      }
      
      const role = await checkUserRole(currentUser);
      console.log("Role refresh completed:", role);
      
      // Update state only if role has changed or was previously null
      if (role !== userRole) {
        setUserRole(role);
      }
      
      // Update last check timestamp
      setLastRoleCheck(Date.now());
      
      return role;
    } catch (error) {
      console.error("Error refreshing user role:", error);
      return userRole; // Return current role on error
    }
  }, [checkUserRole, userRole]);

  const handleAuthStateChange = useCallback(async () => {
    console.info("Auth state changed:", isLoading ? "INITIAL_SESSION" : "SIGNED_IN");
    
    try {
      // Get the current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!currentSession) {
        // User is not signed in
        setUser(null);
        setSession(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }
      
      // User is signed in
      setSession(currentSession);
      setUser(currentSession.user);
      
      // No need to check role if already loaded recently (cache for CACHE_STALE_TIME)
      const shouldRefreshRole = !userRole || (Date.now() - lastRoleCheck) > CACHE_STALE_TIME;
      
      if (shouldRefreshRole) {
        const role = await checkUserRole(currentSession.user);
        setUserRole(role);
        setLastRoleCheck(Date.now());
      }
    } catch (error) {
      console.error("Error handling auth state change:", error);
    } finally {
      setIsLoading(false);
    }
  }, [checkUserRole, isLoading, lastRoleCheck, userRole]);
  
  useEffect(() => {
    handleAuthStateChange();
    
    // Set up subscription
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          // Get user role
          const role = await checkUserRole(session.user);
          setUserRole(role);
          setLastRoleCheck(Date.now());
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
        setIsLoading(false);
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [checkUserRole, handleAuthStateChange]);

  // Email/Password Login
  const signIn = async (email: string, password: string) => {
    try {
      console.info("Starting email login for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Email login error:", error.message);
        throw error;
      }

      setSession(data.session);
      setUser(data.user);
      
      // Check user role after login
      const role = await checkUserRole(data.user);
      setUserRole(role);
      setLastRoleCheck(Date.now());

      console.info("Email login successful for:", email);
      
      // Redirect based on user role
      if (role === 'admin') {
        navigate("/admin/dashboard");
      } else if (role === 'client') {
        navigate("/client/dashboard");
      } else {
        navigate("/"); // Default redirect if no role
      }

      return { success: true };
    } catch (error: any) {
      console.error("Sign in error:", error.message);
      return {
        success: false,
        error: error.message || "An error occurred during login",
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear auth state
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      navigate("/auth");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(`Failed to sign out: ${error.message}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isLoading,
        signIn,
        signOut,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
