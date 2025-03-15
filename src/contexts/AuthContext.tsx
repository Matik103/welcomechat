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

  // Function to clear all auth state and local storage
  const clearAuthState = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear local storage items related to auth
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.expires_at');
      localStorage.removeItem('supabase.auth.refresh_token');
      
      // Clear state
      setSession(null);
      setUser(null);
      setUserRole(null);
      
      // Clear any other potential caches
      sessionStorage.clear();
      
      // Force clear service worker caches if they exist
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        } catch (error) {
          console.error('Error clearing caches:', error);
        }
      }
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      // First check user_roles table for role and client_id
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error checking user_roles:", roleError);
        return null;
      }

      if (!roleData) {
        console.log("No role found for user");
        return null;
      }

      if (roleData?.client_id) {
        // If we have a client_id, verify it exists in ai_agents
        const { data: agentData, error: agentError } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', roleData.client_id)
          .maybeSingle();

        if (agentError) {
          console.error("Error checking ai_agents:", agentError);
          return null;
        }

        if (agentData) {
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
    
    if (role === 'client') {
      const clientDashboardUrl = import.meta.env.PROD 
        ? urls.clientDashboard
        : '/client/dashboard';
        
      if (import.meta.env.PROD) {
        window.location.href = clientDashboardUrl;
      } else {
        navigate(clientDashboardUrl, { replace: true });
      }
    } else {
      if (import.meta.env.PROD) {
        window.location.href = urls.adminDashboard;
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!mounted) return;
        
        setIsLoading(true);
        
        // Clear any existing session and caches
        await clearAuthState();
        
        // Check if we're on an auth page
        const isAuthPage = location.pathname.startsWith('/auth') || 
                         location.pathname.startsWith('/client/setup');
        
        if (!isAuthPage) {
          navigate('/auth', { replace: true });
          return;
        }
        
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        toast.error('Error initializing authentication');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log("Auth state changed:", event);

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (currentSession?.user) {
              const role = await checkUserRole(currentSession.user.id);
              
              if (!role) {
                await clearAuthState();
                toast.error('Error: Unable to determine user role');
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
            
          case 'USER_UPDATED':
            if (!currentSession) {
              await clearAuthState();
              navigate('/auth', { replace: true });
            }
            break;

          default:
            // For any other events, verify the session
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
