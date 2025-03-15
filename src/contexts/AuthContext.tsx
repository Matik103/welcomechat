
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

  // Check user role from the database
  const checkUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
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
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (authInitialized) return; // Prevent multiple initializations
      
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          // Set session and user info immediately
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check for existing role first
          const existingRole = await checkUserRole(currentSession.user.id);
          
          if (existingRole) {
            setUserRole(existingRole);
            setIsLoading(false);
          } else if (currentSession.user.email) {
            // Check if user exists in clients table
            const isClient = await checkIfClientExists(currentSession.user.email);
            
            if (isClient) {
              // Get client ID
              const { data: clientData } = await supabase
                .from('clients')
                .select('id')
                .eq('email', currentSession.user.email)
                .maybeSingle();
                
              if (clientData?.id) {
                await createUserRole(currentSession.user.id, 'client', clientData.id);
                setUserRole('client');
              }
            } else {
              // Not a client, assign admin role
              await createUserRole(currentSession.user.id, 'admin');
              setUserRole('admin');
            }
            
            setIsLoading(false);
          }
        } else {
          // No active session
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          
          // Only redirect to auth if not already on an auth-related page
          if (!location.pathname.startsWith('/auth') && 
              !location.pathname.startsWith('/client/setup')) {
            navigate('/auth', { replace: true });
          }
        }
        
        setAuthInitialized(true);
      } catch (error) {
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

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        try {
          if (event === 'SIGNED_IN') {
            // Set session and user immediately to avoid loading states
            setSession(currentSession);
            setUser(currentSession!.user);
            
            // For sign-ins, continue with existing logic
            setIsLoading(true);
            
            // Check if the user email exists in the clients table
            const isClient = currentSession?.user.email ? 
              await checkIfClientExists(currentSession.user.email) : false;
            
            // Check for existing role
            const existingRole = await checkUserRole(currentSession!.user.id);
            
            if (existingRole) {
              // Use existing role
              setUserRole(existingRole);
              
              // Navigate based on role, minimal delay
              if (location.pathname.startsWith('/auth')) {
                if (existingRole === 'client') {
                  navigate('/client/dashboard', { replace: true });
                } else {
                  navigate('/', { replace: true });
                }
              }
            } else {
              // Assign role based on client check
              if (isClient) {
                // Get client ID
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('email', currentSession!.user.email)
                  .maybeSingle();
                  
                if (clientData?.id) {
                  await createUserRole(currentSession!.user.id, 'client', clientData.id);
                  setUserRole('client');
                  
                  // Navigate to client dashboard if on auth page
                  if (location.pathname.startsWith('/auth')) {
                    navigate('/client/dashboard', { replace: true });
                  }
                }
              } else {
                await createUserRole(currentSession!.user.id, 'admin');
                setUserRole('admin');
                
                // Navigate to admin dashboard if on auth page
                if (location.pathname.startsWith('/auth')) {
                  navigate('/', { replace: true });
                }
              }
            }
            
            setIsLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
            
            if (!location.pathname.startsWith('/auth')) {
              navigate('/auth', { replace: true });
            }
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            // Just update session - don't show loading states
            const role = await checkUserRole(currentSession.user.id);
            setSession(currentSession);
            setUser(currentSession.user);
            setUserRole(role);
          } else if (event === 'USER_UPDATED' && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (error) {
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      // Force state clear and navigation on error
      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
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
