import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

type UserRole = 'admin' | 'client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  userRole: UserRole | null;
  isInitialized: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        return null;
      }

      if (data?.client_id && data.role === 'client') {
        await supabase.auth.updateUser({
          data: { client_id: data.client_id }
        });
      }

      return data?.role as UserRole || null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  const updateAuthStates = async (newSession: Session | null) => {
    try {
      if (newSession?.user) {
        const role = await checkUserRole(newSession.user.id);
        setSession(newSession);
        setUser(newSession.user);
        setUserRole(role);
        return role;
      } else {
        setSession(null);
        setUser(null);
        setUserRole(null);
        return null;
      }
    } catch (error) {
      console.error("Error updating auth states:", error);
      setSession(null);
      setUser(null);
      setUserRole(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          const role = await updateAuthStates(currentSession);
          
          // Handle initial navigation based on role
          if (role === 'client' && !location.pathname.startsWith('/client/dashboard')) {
            navigate('/client/dashboard', { replace: true });
          } else if (role === 'admin' && location.pathname !== '/') {
            navigate('/', { replace: true });
          }
        } else {
          await updateAuthStates(null);
          if (!location.pathname.startsWith('/auth') && 
              !location.pathname.startsWith('/client/setup')) {
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        await updateAuthStates(null);
        if (!location.pathname.startsWith('/auth')) {
          navigate('/auth', { replace: true });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        try {
          if (event === 'SIGNED_IN') {
            setIsLoading(true);
            const role = await updateAuthStates(currentSession);
            
            if (role === 'client' && !location.pathname.startsWith('/client/dashboard')) {
              navigate('/client/dashboard', { replace: true });
            } else if (role === 'admin' && location.pathname !== '/') {
              navigate('/', { replace: true });
            }
          } else if (event === 'SIGNED_OUT') {
            setIsLoading(true);
            await updateAuthStates(null);
            if (!location.pathname.startsWith('/auth')) {
              navigate('/auth', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            setIsLoading(true);
            await updateAuthStates(currentSession);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          await updateAuthStates(null);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await updateAuthStates(null);
      if (!location.pathname.startsWith('/auth')) {
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      console.error("Sign out error:", error);
      await updateAuthStates(null);
      if (!location.pathname.startsWith('/auth')) {
        navigate('/auth', { replace: true });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signOut, 
      isLoading, 
      userRole,
      isInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
