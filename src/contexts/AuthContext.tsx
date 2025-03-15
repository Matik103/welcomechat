
import { createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  checkUserRole, 
  checkIfClientExists, 
  createUserRole, 
  handleGoogleUser, 
  handlePostAuthNavigation,
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
          
          const provider = currentSession.user.app_metadata.provider;
          
          // Prioritize and optimize the Google auth flow
          if (provider === 'google') {
            console.log("Optimizing Google auth flow");
            // For Google users, use a more direct approach to determine role
            const role = await handleGoogleUser(currentSession.user);
            setUserRole(role);
            
            // For callback routes, use a more direct redirection method
            if (isCallbackUrl) {
              forceRedirectToDashboard(role);
            } else {
              // For non-callback routes, use React Router navigation
              handlePostAuthNavigation(role, navigate);
            }
            setIsLoading(false);
          } else {
            // Handle non-Google auth flows
            const existingRole = await checkUserRole(currentSession.user.id);
            
            if (existingRole) {
              setUserRole(existingRole);
              
              if (isCallbackUrl) {
                forceRedirectToDashboard(existingRole);
              } else {
                handlePostAuthNavigation(existingRole, navigate);
              }
              setIsLoading(false);
            } else if (currentSession.user.email) {
              const isClient = await checkIfClientExists(currentSession.user.email);
              
              if (isClient) {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('email', currentSession.user.email)
                  .maybeSingle();
                  
                if (clientData?.id) {
                  await createUserRole(currentSession.user.id, 'client', clientData.id);
                  setUserRole('client');
                  
                  if (isCallbackUrl) {
                    forceRedirectToDashboard('client');
                  } else {
                    handlePostAuthNavigation('client', navigate);
                  }
                }
              } else {
                await createUserRole(currentSession.user.id, 'admin');
                setUserRole('admin');
                
                if (isCallbackUrl) {
                  forceRedirectToDashboard('admin');
                } else {
                  handlePostAuthNavigation('admin', navigate);
                }
              }
              
              setIsLoading(false);
            }
          }
        } else {
          console.log("No active session found during init");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          
          const isAuthRelatedPage = 
            location.pathname.startsWith('/auth') || 
            location.pathname.startsWith('/client/setup');
            
          if (!isAuthRelatedPage) {
            navigate('/auth', { replace: true });
          }
        }
        
        setAuthInitialized(true);
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
            
            setIsLoading(true);
            
            const provider = currentSession?.user.app_metadata.provider;
            
            if (provider === 'google') {
              // Optimize for faster role determination for Google users
              console.log("Fast-tracking Google user role determination");
              const role = await handleGoogleUser(currentSession!.user);
              setUserRole(role);
              
              // For callback routes from Google SSO, use direct redirection
              if (isCallbackUrl) {
                forceRedirectToDashboard(role);
              }
              
              setIsLoading(false);
            } else {
              // Handle other auth providers
              const existingRole = await checkUserRole(currentSession!.user.id);
              
              if (existingRole) {
                setUserRole(existingRole);
                setIsLoading(false);
              } else {
                const isClient = currentSession?.user.email ? 
                  await checkIfClientExists(currentSession.user.email) : false;
                
                if (isClient) {
                  const { data: clientData } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('email', currentSession!.user.email)
                    .maybeSingle();
                    
                  if (clientData?.id) {
                    await createUserRole(currentSession!.user.id, 'client', clientData.id);
                    setUserRole('client');
                  }
                } else {
                  await createUserRole(currentSession!.user.id, 'admin');
                  setUserRole('admin');
                }
                
                setIsLoading(false);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            setSession(null);
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
            
            if (!location.pathname.startsWith('/auth')) {
              navigate('/auth', { replace: true });
            }
          } else if (event === 'USER_UPDATED' && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          
          // Redirect to auth page on error
          navigate('/auth', { replace: true });
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
