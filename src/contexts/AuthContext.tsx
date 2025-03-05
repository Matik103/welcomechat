
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

  const logClientLoginActivity = async (clientId: string) => {
    try {
      await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type: "client_login" as any,
        description: "logged into their account",
        metadata: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error("Failed to log login activity:", error);
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
          console.log("User role detected:", role);
          setUserRole(role);
          
          // If user is a client, make sure they have client_id in metadata
          if (role === 'client' && !initialSession.user.user_metadata?.client_id) {
            const { data: userData } = await supabase
              .from('user_roles')
              .select('client_id')
              .eq('user_id', initialSession.user.id)
              .eq('role', 'client')
              .single();
            
            if (userData?.client_id) {
              console.log("Updating user metadata with client_id:", userData.client_id);
              await supabase.auth.updateUser({
                data: { client_id: userData.client_id }
              });
            }
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

        if (sessionChanged) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const role = await checkUserRole(currentSession.user.id);
            console.log("User role after auth change:", role);
            setUserRole(role);
            
            // Redirect based on role after sign in
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              // Log client login activity if it's a client
              if (role === 'client' && currentSession.user.user_metadata?.client_id) {
                await logClientLoginActivity(currentSession.user.user_metadata.client_id);
              }
              
              // Handle redirects after auth changes
              if (role === 'client') {
                if (!location.pathname.startsWith('/client/')) {
                  navigate('/client/view', { replace: true });
                }
              } else if (role === 'admin') {
                if (location.pathname.startsWith('/client/')) {
                  navigate('/', { replace: true });
                }
              }
            }
          } else {
            setUserRole(null);
            // Only navigate to auth if we're not already there and not loading
            if (!location.pathname.startsWith('/auth') && !location.pathname.startsWith('/client/setup') && authCheckCompleted) {
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
  }, [navigate, location.pathname, authCheckCompleted, session]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUserRole(null);
      setSession(null);
      setUser(null);
      
      navigate('/auth', { replace: true });
      toast.success("Successfully signed out");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
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
