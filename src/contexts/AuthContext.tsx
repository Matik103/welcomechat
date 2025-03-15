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
        
        // Clear any existing session first
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserRole(null);
        
        // Only proceed with auth check if not on auth pages
        if (!location.pathname.startsWith('/auth') && 
            !location.pathname.startsWith('/client/setup')) {
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
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
      console.log("Current session:", currentSession?.user?.email);

      if (currentSession?.user && event === 'SIGNED_IN') {
        const role = await checkUserRole(currentSession.user.id);
        
        setSession(currentSession);
        setUser(currentSession.user);
        setUserRole(role);

        if (role === 'client') {
          handleClientRedirect();
        } else {
          handleAdminRedirect();
        }
      } else {
        setSession(null);
        setUser(null);
        setUserRole(null);
        
        if (!location.pathname.startsWith('/auth')) {
          navigate('/auth', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserRole(null);
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
