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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkUserRole = async (userId: string) => {
    try {
      console.log("Checking user role for:", userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        return null;
      }

      // If user has client_id in user_roles, update user metadata
      if (data?.client_id && data.role === 'client') {
        console.log("Updating user metadata with client_id:", data.client_id);
        await supabase.auth.updateUser({
          data: { client_id: data.client_id }
        });
      }

      console.log("User role found:", data?.role);
      return data?.role as UserRole || null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing auth...");
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Found existing session:", currentSession.user.email);
          const role = await checkUserRole(currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole(role);
        } else {
          // Try to refresh the session
          console.log("No session found, attempting refresh...");
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!mounted) return;

          if (refreshError) {
            console.error("Session refresh failed:", refreshError);
            setSession(null);
            setUser(null);
            setUserRole(null);
            
            if (!location.pathname.startsWith('/auth') && 
                !location.pathname.startsWith('/client/setup')) {
              navigate('/auth', { replace: true });
            }
          } else if (refreshedSession) {
            console.log("Session refreshed successfully:", refreshedSession.user.email);
            const role = await checkUserRole(refreshedSession.user.id);
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log("Auth state changed:", event, currentSession?.user?.email);

        try {
          if (event === 'SIGNED_IN') {
            setIsLoading(true);
            const role = await checkUserRole(currentSession!.user.id);
            setSession(currentSession);
            setUser(currentSession!.user);
            setUserRole(role);
            
            if (role === 'client') {
              navigate('/client/dashboard', { replace: true });
            } else if (role === 'admin') {
              navigate('/', { replace: true });
            }
          } else if (event === 'SIGNED_OUT') {
            setIsLoading(true);
            setSession(null);
            setUser(null);
            setUserRole(null);
            if (!location.pathname.startsWith('/auth')) {
              navigate('/auth', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            setIsLoading(true);
            const role = await checkUserRole(currentSession.user.id);
            setSession(currentSession);
            setUser(currentSession.user);
            setUserRole(role);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          setSession(null);
          setUser(null);
          setUserRole(null);
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
      console.log("Signing out user...");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      // Force state clear and navigation on error
      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, isLoading, userRole }}>
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
