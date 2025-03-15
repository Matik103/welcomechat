
import { createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  createUserRole,
  forceRedirectToDashboard
} from "@/utils/authUtils";
import { useAuthState } from "@/hooks/useAuthState";
import { AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    session, setSession,
    user, setUser,
    userRole, setUserRole,
    isLoading, setIsLoading,
    authInitialized, setAuthInitialized
  } = useAuthState();
  
  const navigate = useNavigate();
  const location = useLocation();
  const isCallbackUrl = location.pathname.includes('/auth/callback');

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (authInitialized) return; // Prevent multiple initializations
      
      try {
        setIsLoading(true);
        console.log("Initializing auth state");
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Session found during init:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          setUserRole('admin');
          
          // Create admin role in database if needed
          try {
            await createUserRole(currentSession.user.id, 'admin');
          } catch (error) {
            console.error("Error creating admin role, but continuing:", error);
          }
          
          // Choose redirect method based on current route
          if (isCallbackUrl) {
            forceRedirectToDashboard();
          } else {
            navigate('/', { replace: true });
          }
        } else {
          console.log("No active session found during init");
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            
            const isAuthRelatedPage = location.pathname.startsWith('/auth');
              
            if (!isAuthRelatedPage) {
              navigate('/auth', { replace: true });
            }
          }
        }
        
        if (mounted) {
          setAuthInitialized(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in initializeAuth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          setAuthInitialized(true);
          
          // Redirect to auth page on error if not already there
          const isAuthPage = location.pathname.startsWith('/auth');
          if (!isAuthPage) {
            navigate('/auth', { replace: true });
          }
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log("Auth state changed:", event);

        try {
          if (event === 'SIGNED_IN') {
            console.log("User signed in:", currentSession?.user.email);
            setSession(currentSession);
            setUser(currentSession!.user);
            setUserRole('admin');
            
            // Create admin role in database
            try {
              await createUserRole(currentSession!.user.id, 'admin');
            } catch (error) {
              console.error("Error creating admin role, but continuing:", error);
            }
            
            // For callback routes, use direct redirection
            if (isCallbackUrl) {
              forceRedirectToDashboard();
            } else {
              navigate('/', { replace: true });
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            if (mounted) {
              setSession(null);
              setUser(null);
              setUserRole(null);
              
              if (!location.pathname.startsWith('/auth')) {
                navigate('/auth', { replace: true });
              }
            }
          } else if (event === 'USER_UPDATED' && currentSession && mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            
            // Redirect to auth page on error
            navigate('/auth', { replace: true });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, authInitialized, setSession, setUser, setUserRole, setIsLoading, setAuthInitialized, isCallbackUrl]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signOut, 
      isLoading,
      userRole 
    }}>
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
