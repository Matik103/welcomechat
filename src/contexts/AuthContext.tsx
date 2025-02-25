
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
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();  // Use maybeSingle instead of single to prevent error

      setUserRole((roleData?.role as UserRole) || null);
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session?.user?.email);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          await checkUserRole(session.user.id);
          
          // Only redirect if on auth page
          if (location.pathname === '/auth') {
            navigate('/', { replace: true });
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          
          // Only redirect to auth if not already there and not on public routes
          if (location.pathname !== '/auth' && !location.pathname.startsWith('/public')) {
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        toast.error("Error initializing authentication");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.email);
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        await checkUserRole(currentSession.user.id);
        
        // Only redirect on sign in if on auth page
        if (event === 'SIGNED_IN' && location.pathname === '/auth') {
          navigate('/', { replace: true });
        }
      } else {
        setSession(null);
        setUser(null);
        setUserRole(null);
        
        // Redirect to auth on sign out if not on public routes
        if (event === 'SIGNED_OUT' && !location.pathname.startsWith('/public')) {
          navigate('/auth', { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all auth state
      setUserRole(null);
      setSession(null);
      setUser(null);
      
      // Store the success message
      const message = "Successfully signed out";
      
      // Navigate first
      navigate('/auth', { replace: true });
      
      // Show toast after navigation
      setTimeout(() => {
        toast.success(message);
      }, 100);
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      // If session is missing, just clear state and redirect
      if (error.message === "Auth session missing!") {
        setUserRole(null);
        setSession(null);
        setUser(null);
        navigate('/auth', { replace: true });
        setTimeout(() => {
          toast.success("Successfully signed out");
        }, 100);
      } else {
        toast.error(error.message || "Failed to sign out");
      }
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
