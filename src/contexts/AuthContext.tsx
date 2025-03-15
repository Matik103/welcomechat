
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
      if (authInitialized && !isCallbackUrl) return; // Prevent multiple initializations
      
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
            // Determine role and prepare for redirect
            const role = await handleAuthenticatedUser(currentSession.user);
            console.log("Role determined during init:", role);
            setUserRole(role);
            
            // Set initialized flag
            setAuthInitialized(true);
            
            // Reset loading state before redirect
            setIsLoading(false);
            
            // Only redirect if not on callback page (let the callback handler do it) 
            if (!isCallbackUrl) {
              console.log(`Navigating to ${role} dashboard`);
              navigate(role === 'admin' ? '/' : '/client/dashboard', { replace: true });
            }
          } catch (error) {
            console.error("Error handling authenticated user:", error);
            // If role determination fails, default to auth page
            if (mounted) {
              console.log("Defaulting to 'admin' role due to error");
              setUserRole('admin');
              setIsLoading(false);
              setAuthInitialized(true);
              navigate('/', { replace: true });
            }
          }
        } else {
          console.log("No active session found during init");
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            
            const isAuthRelatedPage = location.pathname.startsWith('/auth') || 
                                      location.pathname.startsWith('/client/setup');
              
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
        
        // Special handling for callback URLs to avoid double loading/processing
        if (isCallbackUrl && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          console.log("Processing callback auth state change");
          setIsLoading(true);
          
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            
            try {
              console.log("Determining role for callback...");
              const role = await handleAuthenticatedUser(currentSession.user);
              console.log("Role determined in callback:", role);
              setUserRole(role);
              
              // Important: need to complete state updates before redirect
              setIsLoading(false);
              setAuthInitialized(true);
              
              console.log("Callback processing complete, redirecting to dashboard with role:", role);
              forceRedirectBasedOnRole(role);
            } catch (error) {
              console.error("Error in callback auth processing:", error);
              setUserRole('admin'); // Default to admin on error
              setIsLoading(false);
              setAuthInitialized(true);
              navigate('/', { replace: true });
            }
            
            return; // Skip regular auth state change processing for callbacks
          }
        }
        
        // Handle regular auth state changes
        setIsLoading(true);

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", currentSession?.user.email);
            setSession(currentSession);
            setUser(currentSession!.user);
            
            try {
              // Determine role and redirect accordingly
              console.log("Determining role for sign-in...");
              const role = await handleAuthenticatedUser(currentSession!.user);
              console.log("Role determined for sign-in:", role);
              setUserRole(role);
              
              // Reset loading before redirect
              setIsLoading(false);
              
              console.log("Navigating with role:", role);
              navigate(role === 'admin' ? '/' : '/client/dashboard', { replace: true });
            } catch (roleError) {
              console.error("Error determining user role:", roleError);
              // Default redirect if role determination fails
              console.log("Defaulting to 'admin' role due to error");
              setUserRole('admin');
              setIsLoading(false);
              if (mounted) {
                navigate('/', { replace: true });
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
