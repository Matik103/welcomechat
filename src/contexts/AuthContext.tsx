
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

  // Check if user email exists in clients table
  const checkIfClientExists = async (email: string) => {
    try {
      console.log("Checking if email exists in clients table:", email);
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error("Error checking client email:", error);
        return false;
      }

      return !!data; // Convert to boolean
    } catch (error) {
      console.error("Error in checkIfClientExists:", error);
      return false;
    }
  };

  // Check user role from the database
  const checkUserRole = async (userId: string) => {
    try {
      console.log("Checking user role for:", userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        return null;
      }

      // If user has client_id in user_roles, update user metadata
      if (data?.client_id && data.role === 'client') {
        console.log("Updating user metadata with client_id:", data.client_id);
        await supabase.auth.updateUser({
          data: { client_id: data.client_id }
        });
      }

      console.log("User role found:", data?.role);
      return data?.role as UserRole || null;
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  // Create a user role in the database
  const createUserRole = async (userId: string, role: UserRole, clientId?: string) => {
    try {
      console.log(`Creating ${role} role for user:`, userId);
      const roleData: any = {
        user_id: userId,
        role: role
      };
      
      if (clientId && role === 'client') {
        roleData.client_id = clientId;
      }
      
      const { error } = await supabase
        .from('user_roles')
        .insert(roleData);
        
      if (error) {
        console.error("Error creating user role:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in createUserRole:", error);
      return false;
    }
  };

  useEffect(() => {
    // Process hash parameters from OAuth redirect
    const handleHashParameters = async () => {
      // Only process if we have hash parameters and are on the auth route
      if (window.location.hash && location.pathname.includes('/auth')) {
        console.log("Processing hash parameters from OAuth redirect");
        setIsLoading(true);
        
        try {
          // Get the current session which should include the OAuth data
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Error getting session from URL:", sessionError);
            toast.error("Authentication failed. Please try again.");
            setIsLoading(false);
            return;
          }
          
          if (sessionData?.session) {
            console.log("Session retrieved from URL, user:", sessionData.session.user.email);
            
            // Check if the user email exists in the clients table
            const isClient = sessionData.session.user.email ? 
              await checkIfClientExists(sessionData.session.user.email) : false;
            
            // Set session and user first
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            
            // Check for existing role
            const existingRole = await checkUserRole(sessionData.session.user.id);
            
            if (existingRole) {
              // Use existing role
              console.log("Using existing role:", existingRole);
              setUserRole(existingRole);
            } else {
              // Assign role based on client check
              if (isClient) {
                console.log("User email found in clients table, assigning client role");
                
                // Get client ID
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('email', sessionData.session.user.email)
                  .maybeSingle();
                  
                if (clientData?.id) {
                  const success = await createUserRole(sessionData.session.user.id, 'client', clientData.id);
                  if (success) {
                    setUserRole('client');
                    
                    // Navigate to client dashboard
                    console.log("Redirecting to client dashboard");
                    navigate('/client/dashboard', { replace: true });
                  }
                }
              } else {
                console.log("Email not found in clients table, assigning admin role");
                const success = await createUserRole(sessionData.session.user.id, 'admin');
                if (success) {
                  setUserRole('admin');
                  
                  // Navigate to admin dashboard
                  console.log("Redirecting to admin dashboard");
                  navigate('/', { replace: true });
                }
              }
            }
            
            // Clear the hash to prevent processing it again
            window.history.replaceState(null, "", window.location.pathname);
          } else {
            console.log("No session found in URL");
          }
        } catch (e) {
          console.error("Error processing auth redirect:", e);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleHashParameters();
  }, [navigate, location.pathname]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing auth...");
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession?.user) {
          console.log("Found existing session:", currentSession.user.email);
          
          // Set session and user info
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check for existing role first
          const existingRole = await checkUserRole(currentSession.user.id);
          
          if (existingRole) {
            setUserRole(existingRole);
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
          }
        } else {
          // No active session
          setSession(null);
          setUser(null);
          setUserRole(null);
          
          // Only redirect to auth if not already on an auth-related page
          if (!location.pathname.startsWith('/auth') && 
              !location.pathname.startsWith('/client/setup')) {
            navigate('/auth', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log("Auth state changed:", event, currentSession?.user?.email);

        try {
          if (event === 'SIGNED_IN') {
            setIsLoading(true);
            
            // Set session and user first
            setSession(currentSession);
            setUser(currentSession!.user);
            
            // Check if the user email exists in the clients table
            const isClient = currentSession?.user.email ? 
              await checkIfClientExists(currentSession.user.email) : false;
            
            // Check for existing role
            const existingRole = await checkUserRole(currentSession!.user.id);
            
            if (existingRole) {
              // Use existing role
              setUserRole(existingRole);
              
              // Navigate based on role
              if (existingRole === 'client') {
                navigate('/client/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            } else {
              // Assign role based on client check
              if (isClient) {
                console.log("User email found in clients table, assigning client role");
                
                // Get client ID
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('email', currentSession!.user.email)
                  .maybeSingle();
                  
                if (clientData?.id) {
                  await createUserRole(currentSession!.user.id, 'client', clientData.id);
                  setUserRole('client');
                  
                  // Navigate to client dashboard
                  navigate('/client/dashboard', { replace: true });
                }
              } else {
                console.log("Email not found in clients table, assigning admin role");
                await createUserRole(currentSession!.user.id, 'admin');
                setUserRole('admin');
                
                // Navigate to admin dashboard
                navigate('/', { replace: true });
              }
            }
            
            setIsLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setIsLoading(true);
            setSession(null);
            setUser(null);
            setUserRole(null);
            if (!location.pathname.startsWith('/auth')) {
              navigate('/auth', { replace: true });
            }
            setIsLoading(false);
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            setIsLoading(true);
            const role = await checkUserRole(currentSession.user.id);
            setSession(currentSession);
            setUser(currentSession.user);
            setUserRole(role);
            setIsLoading(false);
          } else if (event === 'USER_UPDATED' && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
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
  }, [navigate, location.pathname]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("Signing out user...");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      // Force state clear and navigation on error
      setSession(null);
      setUser(null);
      setUserRole(null);
      navigate('/auth', { replace: true });
      throw error;
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
