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

  const checkUserRole = async (userId: string) => {
    try {
      console.log("Checking user role for:", userId);
      
      // First check user_roles table for role and client_id
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error checking user_roles:", roleError);
        return 'admin' as UserRole;
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
        } else if (agentData) {
          console.log("Found matching AI agent - setting as client");
          return 'client' as UserRole;
        }
      }

      // Default to admin if no client role found
      console.log("No client role found - setting as admin");
      return 'admin' as UserRole;
    } catch (error) {
      console.error("Error checking user role:", error);
      return 'admin' as UserRole;
    }
  };

  const handleClientRedirect = () => {
    console.log("Handling client redirect");
    // Always redirect clients to the client dashboard
    const clientDashboardUrl = import.meta.env.PROD 
      ? 'https://admin.welcome.chat/client/dashboard'
      : '/client/dashboard';
    
    console.log("Redirecting client to:", clientDashboardUrl);
    
    if (import.meta.env.PROD) {
      window.location.href = clientDashboardUrl;
    } else {
      navigate(clientDashboardUrl, { replace: true });
    }
  };

  const handleAdminRedirect = () => {
    const urls = getAppUrls();
    console.log("Handling admin redirect");
    console.log("Is production?", import.meta.env.PROD);
    
    // Force redirect to admin dashboard in production
    if (import.meta.env.PROD) {
      console.log("Production environment detected, redirecting to:", urls.adminDashboard);
      window.location.href = urls.adminDashboard;
      return;
    }
    
    // In development, use internal navigation
    console.log("Development environment detected, using internal navigation");
    navigate('/', { replace: true });
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing auth...");
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Found existing session:", currentSession.user.email);
          console.log("User metadata:", currentSession.user.user_metadata);
          console.log("App metadata:", currentSession.user.app_metadata);
          
          const role = await checkUserRole(currentSession.user.id);
          console.log("Determined role:", role);
          
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole(role);

          // Check if user is a client
          const isClient = role === 'client';
          
          if (isClient) {
            console.log("Client user detected, handling redirect");
            handleClientRedirect();
          } else {
            console.log("Admin user detected, redirecting to admin dashboard");
            handleAdminRedirect();
          }
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
            console.log("Sign in event detected");
            console.log("User metadata:", currentSession?.user.user_metadata);
            console.log("App metadata:", currentSession?.user.app_metadata);
            
            const role = await checkUserRole(currentSession!.user.id);
            console.log("Determined role after sign in:", role);
            
            setSession(currentSession);
            setUser(currentSession!.user);
            setUserRole(role);
            
            // Check if user is a client
            const isClient = role === 'client';
            
            if (isClient) {
              console.log("Client user detected, handling redirect");
              handleClientRedirect();
            } else {
              console.log("Admin user detected, redirecting to admin dashboard");
              handleAdminRedirect();
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
