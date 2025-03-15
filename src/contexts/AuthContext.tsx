
import { createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  checkUserRole, 
  checkIfClientExists, 
  createUserRole, 
  handleGoogleUser, 
  handlePostAuthNavigation 
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
          
          // Faster Google auth flow prioritization
          const isGoogleUser = currentSession.user.app_metadata.provider === 'google';
          
          if (isGoogleUser || isCallbackUrl) {
            // Prioritize SSO role determination for quick redirect
            const role = await handleGoogleUser(currentSession.user);
            setUserRole(role);
            setIsLoading(false);
            
            // Skip navigation on callback page - App.tsx will handle it immediately once role is set
            if (!isCallbackUrl) {
              handlePostAuthNavigation(role, navigate);
            }
          } else {
            const existingRole = await checkUserRole(currentSession.user.id);
            
            if (existingRole) {
              setUserRole(existingRole);
              
              // Only redirect if we're not on the callback page
              if (!isCallbackUrl) {
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
                  
                  // Only redirect if we're not on the callback page
                  if (!isCallbackUrl) {
                    handlePostAuthNavigation('client', navigate);
                  }
                }
              } else {
                await createUserRole(currentSession.user.id, 'admin');
                setUserRole('admin');
                
                // Only redirect if we're not on the callback page
                if (!isCallbackUrl) {
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
            
            // Optimize for fast role determination, especially for callback paths
            if (isCallbackUrl || currentSession?.user.app_metadata.provider === 'google') {
              // Fast-path for Google users and callback URLs
              const role = await handleGoogleUser(currentSession!.user);
              setUserRole(role);
              setIsLoading(false);
              
              // App.tsx will handle navigation on callback page
            } else {
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
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, authInitialized, setSession, setUser, setUserRole, setIsLoading, setAuthInitialized]);

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
