
import { createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  createUserRole,
  forceRedirectBasedOnRole,
  handleAuthenticatedUser
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
          
          try {
            // Determine role and redirect accordingly
            const role = await handleAuthenticatedUser(currentSession.user);
            setUserRole(role);
            
            // Reset loading state before redirect to prevent stale UI
            setIsLoading(false);
            setAuthInitialized(true);
            
            // Choose redirect method based on current route
            if (isCallbackUrl) {
              console.log(`Redirecting from callback to ${role} dashboard`);
              forceRedirectBasedOnRole(role);
            } else {
              console.log(`Navigating to ${role} dashboard`);
              navigate(role === 'admin' ? '/' : '/client/dashboard', { replace: true });
            }
          } catch (error) {
            console.error("Error handling authenticated user:", error);
            // If role determination fails, default to auth page
            if (mounted) {
              setUserRole(null);
              setIsLoading(false);
              setAuthInitialized(true);
              navigate('/auth', { replace: true });
            }
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
            
            setIsLoading(false);
            setAuthInitialized(true);
          }
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

    // Auth state change listener subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        setIsLoading(true);

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", currentSession?.user.email);
            setSession(currentSession);
            setUser(currentSession!.user);
            
            try {
              // Determine role and redirect accordingly
              const role = await handleAuthenticatedUser(currentSession!.user);
              setUserRole(role);
              
              // Reset loading before redirect
              setIsLoading(false);
              
              // For callback routes, use direct redirection
              if (isCallbackUrl) {
                console.log("Redirecting from callback with role:", role);
                forceRedirectBasedOnRole(role);
              } else {
                console.log("Navigating with role:", role);
                navigate(role === 'admin' ? '/' : '/client/dashboard', { replace: true });
              }
            } catch (roleError) {
              console.error("Error determining user role:", roleError);
              // Default redirect if role determination fails
              setIsLoading(false);
              if (mounted) {
                navigate('/auth', { replace: true });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            if (mounted) {
              setSession(null);
              setUser(null);
              setUserRole(null);
              setIsLoading(false);
              
              if (!location.pathname.startsWith('/auth')) {
                navigate('/auth', { replace: true });
              }
            }
          } else if (event === 'USER_UPDATED' && currentSession && mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            setIsLoading(false);
          } else {
            // Handle other events
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
            
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
