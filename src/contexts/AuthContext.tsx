
import { createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { AuthContextType } from "@/types/auth";
import { toast } from "sonner";
import { determineUserRole, isClientInDatabase, forceRedirectBasedOnRole } from "@/utils/authUtils";

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

  // Handle Google SSO callback and client restriction
  useEffect(() => {
    if (isCallbackUrl) {
      const handleCallback = async () => {
        try {
          // Get the session from the URL
          const { data: { session: callbackSession }, error: sessionError } = 
            await supabase.auth.getSession();
            
          if (sessionError || !callbackSession) {
            console.error("Error getting session from callback URL:", sessionError);
            toast.error("Authentication failed. Please try again.");
            navigate('/auth', { replace: true });
            return;
          }
          
          const user = callbackSession.user;
          
          // Check if this is a Google login and if the user is a client
          const provider = user?.app_metadata?.provider;
          const isGoogleLogin = provider === 'google';
          
          if (isGoogleLogin && user.email) {
            // Check if this email belongs to a client
            const isClient = await isClientInDatabase(user.email);
            
            if (isClient) {
              // If client trying to use Google SSO, sign them out
              console.log("Client attempted to use Google SSO, signing out:", user.email);
              await supabase.auth.signOut();
              toast.error("Clients must use email and password to sign in. Google sign-in is only available for administrators.");
              navigate('/auth', { replace: true });
              return;
            }
            
            // Admin user with Google SSO is allowed to proceed
            console.log("Admin authenticated with Google SSO:", user.email);
            setSession(callbackSession);
            setUser(user);
            
            // Get user role and set it
            const role = await determineUserRole(user);
            setUserRole(role);
            
            console.log("Setting role for Google SSO user:", role);
            setIsLoading(false);
            navigate('/', { replace: true });
          } else {
            // Non-Google login, proceed normally
            setSession(callbackSession);
            setUser(user);
            
            // Get user role and set it
            const role = await determineUserRole(user);
            setUserRole(role);
            
            console.log("Setting role for regular user:", role);
            setIsLoading(false);
            
            // Redirect based on role
            if (role === 'client') {
              navigate('/client/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error handling auth callback:", error);
          toast.error("Authentication failed. Please try again.");
          navigate('/auth', { replace: true });
        } finally {
          setIsLoading(false);
        }
      };
      
      handleCallback();
    }
  }, [isCallbackUrl, navigate, setSession, setUser, setUserRole, setIsLoading]);

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
          
          // Get user role
          const role = await determineUserRole(currentSession.user);
          setUserRole(role);
          console.log("User role determined:", role);
          
          // Reset loading state
          setIsLoading(false);
          
          if (!isCallbackUrl && !isAuthPage) {
            if (role === 'client') {
              navigate('/client/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          } else if (isAuthPage) {
            if (role === 'client') {
              navigate('/client/dashboard', { replace: true });
            } else {
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
        
        setIsLoading(true);

        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", currentSession?.user.email);
            
            // Check if this is a Google login and if the user is a client
            const user = currentSession?.user;
            const provider = user?.app_metadata?.provider;
            const isGoogleLogin = provider === 'google';
            
            if (isGoogleLogin && user?.email) {
              // Check if this email belongs to a client
              const isClient = await isClientInDatabase(user.email);
              
              if (isClient) {
                // If client trying to use Google SSO, sign them out
                console.log("Client attempted to use Google SSO, signing out:", user.email);
                await supabase.auth.signOut();
                toast.error("Clients must use email and password to sign in. Google sign-in is only available for administrators.");
                navigate('/auth', { replace: true });
                setIsLoading(false);
                return;
              }
            }
            
            setSession(currentSession);
            setUser(currentSession!.user);
            
            // Get user role
            const role = await determineUserRole(currentSession!.user);
            setUserRole(role);
            console.log("User role set:", role);
            
            // Reset loading before redirect
            setIsLoading(false);
            
            if (role === 'client') {
              navigate('/client/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
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
