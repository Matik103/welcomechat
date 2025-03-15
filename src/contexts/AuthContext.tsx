import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { checkIfClientExists, createUserRole } from "@/services/authService";

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
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkUserRole = async (userId: string): Promise<UserRole | null> => {
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

      if (data?.client_id && data.role === 'client') {
        await supabase.auth.updateUser({
          data: { client_id: data.client_id }
        });
      }

      return data?.role as UserRole || null;
    } catch (error) {
      console.error("Exception in checkUserRole:", error);
      return null;
    }
  };

  const handleGoogleUser = async (currentUser: User): Promise<UserRole> => {
    console.log("Handling Google user:", currentUser.email);
    const existingRole = await checkUserRole(currentUser.id);
    
    if (existingRole) {
      console.log("Existing role found for Google user:", existingRole);
      return existingRole;
    }
    
    console.log("Assigning admin role to Google user");
    await createUserRole(currentUser.id, 'admin');
    return 'admin';
  };

  const handlePostAuthNavigation = (role: UserRole) => {
    console.log("Handling post-auth navigation for role:", role);
    
    const isOnAuthPage = location.pathname === '/auth' || 
                          location.pathname.startsWith('/auth/callback');
    
    if (isOnAuthPage) {
      console.log("On auth page, redirecting based on role");
      if (role === 'admin') {
        navigate('/', { replace: true });
      } else if (role === 'client') {
        navigate('/client/dashboard', { replace: true });
      }
    }
  };

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
          
          const isGoogleUser = currentSession.user.app_metadata.provider === 'google';
          
          if (isGoogleUser) {
            const role = await handleGoogleUser(currentSession.user);
            setUserRole(role);
            handlePostAuthNavigation(role);
            setIsLoading(false);
          } else {
            const existingRole = await checkUserRole(currentSession.user.id);
            
            if (existingRole) {
              setUserRole(existingRole);
              handlePostAuthNavigation(existingRole);
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
                  handlePostAuthNavigation('client');
                }
              } else {
                await createUserRole(currentSession.user.id, 'admin');
                setUserRole('admin');
                handlePostAuthNavigation('admin');
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
            
            setIsLoading(true);
            
            const isGoogleUser = currentSession?.user.app_metadata.provider === 'google';
            
            if (isGoogleUser) {
              const role = await handleGoogleUser(currentSession!.user);
              setUserRole(role);
              
              handlePostAuthNavigation(role);
              
              setIsLoading(false);
            } else {
              const isClient = currentSession?.user.email ? 
                await checkIfClientExists(currentSession.user.email) : false;
              
              const existingRole = await checkUserRole(currentSession!.user.id);
              
              if (existingRole) {
                setUserRole(existingRole);
                
                handlePostAuthNavigation(existingRole);
              } else {
                if (isClient) {
                  const { data: clientData } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('email', currentSession!.user.email)
                    .maybeSingle();
                    
                  if (clientData?.id) {
                    await createUserRole(currentSession!.user.id, 'client', clientData.id);
                    setUserRole('client');
                    handlePostAuthNavigation('client');
                  }
                } else {
                  await createUserRole(currentSession!.user.id, 'admin');
                  setUserRole('admin');
                  handlePostAuthNavigation('admin');
                }
              }
              
              setIsLoading(false);
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
  }, [navigate, location.pathname, authInitialized]);

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
