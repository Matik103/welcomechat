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

// Separate the hook into its own named function for better Fast Refresh support
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export both the provider and the hook
export { AuthContext, useAuth };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkUserRole = async (userId: string): Promise<UserRole | null> => {
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

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session: storedSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (storedSession) {
          setSession(storedSession);
          setUser(storedSession.user);
          
          const role = await checkUserRole(storedSession.user.id);
          if (mounted) {
            setUserRole(role);
            
            // Redirect based on role and current path
            if (!location.pathname.startsWith('/auth') && !location.pathname.startsWith('/client/setup')) {
              const correctPath = role === 'client' ? '/client/view' : '/';
              if (location.pathname !== correctPath) {
                navigate(correctPath, { replace: true });
              }
            }
          }
        } else {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!mounted) return;

          if (refreshError) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            
            if (!location.pathname.startsWith('/auth') && !location.pathname.startsWith('/client/setup')) {
              navigate('/auth', { replace: true });
            }
          } else if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            
            const role = await checkUserRole(refreshedSession.user.id);
            if (mounted) {
              setUserRole(role);
              
              // Redirect based on role and current path
              if (!location.pathname.startsWith('/auth') && !location.pathname.startsWith('/client/setup')) {
                const correctPath = role === 'client' ? '/client/view' : '/';
                if (location.pathname !== correctPath) {
                  navigate(correctPath, { replace: true });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
        navigate('/auth', { replace: true });
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        const role = await checkUserRole(currentSession.user.id);
        if (mounted) {
          setUserRole(role);
          
          if (event === 'SIGNED_IN') {
            const correctPath = role === 'client' ? '/client/view' : '/';
            navigate(correctPath, { replace: true });
          }
        }
      }
      
      setIsLoading(false);
    });

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

      setUserRole(null);
      setSession(null);
      setUser(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
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
