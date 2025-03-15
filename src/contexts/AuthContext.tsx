
import { createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { AuthContextType } from "@/types/auth";
import { toast } from "sonner";

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
  const isAuthPage = location.pathname === '/auth';

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Safety timeout triggered to prevent infinite loading");
        setIsLoading(false);
        
        // If we've been stuck loading and not on auth page, redirect to auth
        if (!isAuthPage && !session) {
          console.log("Redirecting to auth page due to timeout");
          navigate('/auth', { replace: true });
        }
      }
    }, 8000); // 8-second safety timeout
    
    return () => clearTimeout(safetyTimeout);
  }, [isLoading, navigate, isAuthPage, session]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (authInitialized && !isCallbackUrl) return;
      
      try {
        setIsLoading(true);
        console.log("Initializing auth state");
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Session found during init:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Set initialized flag
          setAuthInitialized(true);
          
          // Reset loading state
          setIsLoading(false);
          
          // Placeholder for new role determination logic
          // Will be replaced with new Google SSO logic
          setUserRole('admin'); // Default to admin for now
          
          if (!isCallbackUrl && !isAuthPage) {
            navigate('/', { replace: true });
          } else if (isAuthPage) {
            navigate('/', { replace: true });
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
        
        setIsLoading(true);

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", currentSession?.user.email);
            setSession(currentSession);
            setUser(currentSession!.user);
            
            // Placeholder for new role determination logic
            // Will be replaced with new Google SSO logic
            setUserRole('admin'); // Default to admin for now
            
            // Reset loading before redirect
            setIsLoading(false);
            
            navigate('/', { replace: true });
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
      toast.error('Sign out error. Please try again.');
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
