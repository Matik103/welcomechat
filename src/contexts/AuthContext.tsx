
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
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on an auth special page (password reset, setup, etc.)
  const isAuthSpecialPage = 
    location.pathname.startsWith('/client/setup') || 
    location.pathname.startsWith('/auth/reset-password') ||
    location.pathname.startsWith('/auth/callback');

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
        console.log("Initializing auth...");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          console.log("Initial session found:", initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
          
          const role = await checkUserRole(initialSession.user.id);
          setUserRole(role);
          
          // If on the setup page with a session, only redirect if not in setup flow
          // (URL has no id parameter)
          if (location.pathname.startsWith('/client/setup') && !location.search.includes('id=')) {
            console.log("Already logged in on setup page without ID, redirecting to dashboard");
            navigate('/client/view', { replace: true });
          }
          
          // Don't redirect if we're on a special auth page (password reset, callback, etc.)
          // or if we're processing a hash fragment
          if (!isAuthSpecialPage && !location.hash) {
            console.log("Authenticated user on non-auth page, no redirection needed");
          }
        } else {
          console.log("No initial session found");
          // If no session and not on auth page or special auth page, redirect to auth
          if (!location.pathname.startsWith('/auth') && !isAuthSpecialPage) {
            console.log("No session, not on auth page, redirecting to auth");
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthCheckCompleted(true);
          console.log("Auth check completed");
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log("Auth state changed:", event, currentSession?.user?.email);

        // Set loading to true for auth state changes
        if (!authCheckCompleted || event !== 'INITIAL_SESSION') {
          setIsLoading(true);
        }

        // Only update session if it's actually different
        const sessionChanged = 
          (currentSession?.user?.id !== session?.user?.id) ||
          (currentSession === null && session !== null);

        if (sessionChanged || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("Session changed, updating state");
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const role = await checkUserRole(currentSession.user.id);
            setUserRole(role);
            
            // Redirect based on role after sign in, but only if not on a special auth page
            if (event === 'SIGNED_IN' && !isAuthSpecialPage) {
              console.log("Sign in detected, redirecting based on role:", role);
              if (role === 'client') {
                // Add small delay to ensure auth is complete
                setTimeout(() => {
                  console.log("Redirecting client to dashboard");
                  navigate('/client/view', { replace: true });
                }, 800);
              } else if (role === 'admin') {
                navigate('/', { replace: true });
              }
            }
          } else {
            setUserRole(null);
            
            // Only navigate to auth if we're not already there and not loading
            // Also don't redirect if we're on a special auth page
            if (!location.pathname.startsWith('/auth') && 
                !isAuthSpecialPage && 
                authCheckCompleted) {
              navigate('/auth', { replace: true });
            }
          }
        }
        
        // Always set loading to false when done processing
        setIsLoading(false);
        setAuthCheckCompleted(true);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, location.search, location.hash, authCheckCompleted, session, isAuthSpecialPage]);

  const signOut = async () => {
    try {
      console.log("Signing out user...");
      
      // First, check if we have a valid session before attempting to sign out
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session during sign out:", sessionError);
      }
      
      // If we already don't have a session, just update the UI state
      if (!sessionData?.session) {
        console.log("No active session found, updating UI state only");
        setUserRole(null);
        setSession(null);
        setUser(null);
        navigate('/auth', { replace: true });
        return Promise.resolve();
      }
      
      // If we have a session, try to sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during sign out:", error);
        throw error;
      }

      console.log("Sign out successful, updating state");
      setUserRole(null);
      setSession(null);
      setUser(null);
      
      // Force navigation to auth page
      navigate('/auth', { replace: true });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Sign out error:", error);
      
      // Even if sign out fails, update local state
      setUserRole(null);
      setSession(null);
      setUser(null);
      
      return Promise.reject(error);
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
