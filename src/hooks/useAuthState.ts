
import { useState, useEffect, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/contexts/AuthContext";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Enhanced auth state initialization with improved caching
  const initializeAuthState = useCallback(async () => {
    try {
      // Try to get session from cache first for instant rendering
      const cachedAuth = sessionStorage.getItem('auth_state');
      if (cachedAuth) {
        try {
          const { user: cachedUser, session: cachedSession, userRole: cachedRole } = JSON.parse(cachedAuth);
          if (cachedUser && cachedSession) {
            setUser(cachedUser);
            setSession(cachedSession);
            setUserRole(cachedRole as UserRole);
            // Still verify with Supabase in background but don't block UI
            setTimeout(() => {
              supabase.auth.getSession().then(({ data }) => {
                if (!data.session) {
                  // Session expired, clear state
                  setUser(null);
                  setSession(null);
                  setUserRole(null);
                  sessionStorage.removeItem('auth_state');
                }
              });
            }, 0);
            // Set loading to false immediately for better UX
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing cached auth:", e);
          sessionStorage.removeItem('auth_state');
        }
      }
      
      // No valid cache, get session from Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
        setIsLoading(false);
        return;
      }
      
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Get role from user metadata
        const role = data.session.user?.user_metadata?.role;
        
        if (role) {
          setUserRole(role as UserRole);
          console.log("User role set from metadata:", role);
        } else {
          // If role not in metadata, try to determine from client relationship
          try {
            const clientResult = await supabase
              .from("clients")
              .select("id")
              .eq("user_id", data.session.user.id)
              .maybeSingle();
              
            // Use a function instead of RPC to avoid TS errors
            const adminCheck = await supabase
              .from("user_roles")
              .select("*")
              .eq("user_id", data.session.user.id)
              .eq("role", "admin")
              .maybeSingle();
            
            if (clientResult.data) {
              setUserRole("client");
              console.log("User role determined as client");
            } else if (adminCheck.data) {
              setUserRole("admin");
              console.log("User role determined as admin");
            } else {
              // If no specific role found, defaulting to admin temporarily
              console.log("No role found in database, defaulting to admin");
              setUserRole("admin");
            }
          } catch (dbError) {
            console.error("Error checking role relationships:", dbError);
            // Default to admin role if there's an error checking
            console.log("Error determining role, defaulting to admin");
            setUserRole("admin");
          }
        }
      } else {
        // No session from Supabase
        setUser(null);
        setUserRole(null);
      }
      
    } catch (error) {
      console.error("Error in auth state initialization:", error);
    } finally {
      // Always set loading to false to prevent blank screens
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on component mount
  useEffect(() => {
    // Always initialize auth state to prevent blank screens
    initializeAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          
          const role = session.user?.user_metadata?.role;
          if (role) {
            setUserRole(role as UserRole);
            
            // Cache authentication state for faster loading
            try {
              sessionStorage.setItem('auth_state', JSON.stringify({
                user: session.user,
                session,
                userRole: role,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.error("Error caching auth state:", e);
            }
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          sessionStorage.removeItem('auth_state');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuthState]);

  return { 
    user, 
    userRole, 
    isLoading, 
    setIsLoading, 
    session, 
    setSession, 
    setUser, 
    setUserRole,
    authInitialized,
    setAuthInitialized
  };
}
