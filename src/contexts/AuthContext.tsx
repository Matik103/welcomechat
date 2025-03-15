import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { getAppUrls } from "@/config/urls";

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

  const clearAuthState = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setSession(null);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error("Error or no data when checking user_roles:", roleError);
        return null;
      }

      if (roleData.client_id) {
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', roleData.client_id)
          .maybeSingle();

        if (!agentError && agentData) {
          return 'client' as UserRole;
        }
      }

      return roleData.role as UserRole || 'admin';
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  const handleRedirect = async (role: UserRole | null) => {
    if (!role) {
      await clearAuthState();
      navigate('/auth', { replace: true });
      return;
    }

    const urls = getAppUrls();
    const isAuthPage = location.pathname.startsWith('/auth') || 
                      location.pathname.startsWith('/client/setup');
    
    // Don't redirect if we're already on the correct page
    if (role === 'client') {
      const clientPath = import.meta.env.PROD ? urls.clientDashboard : '/client/dashboard';
      const isOnClientPath = location.pathname.startsWith('/client/dashboard');
      
      if (!isOnClientPath && !isAuthPage) {
        if (import.meta.env.PROD) {
          window.location.href = clientPath;
        } else {
          navigate(clientPath, { replace: true });
        }
      }
    } else {
      const adminPath = import.meta.env.PROD ? urls.adminDashboard : '/';
      const isOnAdminPath = location.pathname === '/';
      
      if (!isOnAdminPath && !isAuthPage) {
        if (import.meta.env.PROD) {
          window.location.href = adminPath;
        } else {
          navigate(adminPath, { replace: true });
        }
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        
        setIsLoading(true);
        
        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // If we have a session, verify it
        if (currentSession?.user) {
          const role = await checkUserRole(currentSession.user.id);
          
          if (role) {
            setSession(currentSession);
            setUser(currentSession.user);
            setUserRole(role);
            await handleRedirect(role);
          } else {
            await clearAuthState();
            navigate('/auth', { replace: true });
          }
        } else {
          // No session, clear everything
          await clearAuthState();
          
          const isAuthPage = location.pathname.startsWith('/auth') || 
                           location.pathname.startsWith('/client/setup');
          
          if (!isAuthPage) {
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        await clearAuthState();
        navigate('/auth', { replace: true });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (currentSession?.user) {
              const role = await checkUserRole(currentSession.user.id);
              
              if (!role) {
                await clearAuthState();
                toast.error('Unable to determine user role');
                navigate('/auth', { replace: true });
                return;
              }
              
              setSession(currentSession);
              setUser(currentSession.user);
              setUserRole(role);
              await handleRedirect(role);
            }
            break;
            
          case 'SIGNED_OUT':
            await clearAuthState();
            navigate('/auth', { replace: true });
            break;
            
          case 'TOKEN_REFRESHED':
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
            }
            break;

          default:
            if (!currentSession) {
              await clearAuthState();
              navigate('/auth', { replace: true });
            }
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        await clearAuthState();
        toast.error('Error processing authentication');
        navigate('/auth', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signOut = async () => {
    try {
      await clearAuthState();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const value = {
    session,
    user,
    signOut,
    isLoading,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
