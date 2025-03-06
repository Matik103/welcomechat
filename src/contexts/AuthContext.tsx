
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

  const checkUserRole = async (userId: string) => {
    try {
      console.log("Checking user role for userId:", userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        return null;
      }

      console.log("User role data:", data);

      // If user has client_id in user_roles, update user metadata
      if (data?.client_id && data.role === 'client') {
        try {
          console.log("Updating user metadata with client_id:", data.client_id);
          await supabase.auth.updateUser({
            data: { client_id: data.client_id }
          });
        } catch (updateError) {
          console.error("Error updating user metadata:", updateError);
        }
      }

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
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
        }
        
        if (!mounted) return;

        if (initialSession) {
          console.log("Initial session found:", initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          const role = await checkUserRole(initialSession.user.id);
          console.log("User role:", role);
          setUserRole(role);
          
          // If on the setup page with a session, redirect to dashboard
          if (location.pathname.startsWith('/client/setup') && !location.search.includes('id=')) {
            navigate('/client/view', { replace: true });
          }
        } else {
          console.log("No initial session found");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthCheckCompleted(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change event:", event);
        
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing state");
          setSession(null);
          setUser(null);
          setUserRole(null);
          navigate('/auth', { replace: true });
          setIsLoading(false);
          return;
        }

        // Only update session if it's actually different
        const sessionChanged = 
          (currentSession?.user?.id !== session?.user?.id) ||
          (currentSession === null && session !== null);

        if (sessionChanged || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log("Setting new session");
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const role = await checkUserRole(currentSession.user.id);
            setUserRole(role);
            
            // Redirect based on role after sign in
            if (event === 'SIGNED_IN') {
              if (role === 'client') {
                navigate('/client/view', { replace: true });
              } else if (role === 'admin') {
                navigate('/', { replace: true });
              }
            }
          } else {
            setUserRole(null);
            // Only navigate to auth if we're not already there and not loading
            // Also don't redirect if we're on the setup page
            if (!location.pathname.startsWith('/auth') && 
                !location.pathname.startsWith('/client/setup') && 
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
  }, [navigate, location.pathname, location.search, authCheckCompleted, session]);

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase sign out error:", error);
        throw error;
      }

      console.log("Sign out successful, clearing state");
      setUserRole(null);
      setSession(null);
      setUser(null);
      
      navigate('/auth', { replace: true });
      console.log("Navigation to auth page complete");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
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
