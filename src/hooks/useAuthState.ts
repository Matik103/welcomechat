
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
      console.log("Attempting to restore auth state from session storage");
      
      // Try to get session from Supabase
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
          // We need to check if these tables exist first and handle accordingly
          try {
            // Check for client relationship
            const clientResult = await supabase
              .from("clients")
              .select("id")
              .eq("user_id", data.session.user.id)
              .maybeSingle();
              
            // Check for admin relationship
            // Use "administrators" table instead of "admins" which might not exist
            const adminResult = await supabase
              .from("administrators")
              .select("id")
              .eq("user_id", data.session.user.id)
              .maybeSingle();
              
            if (clientResult.data) {
              setUserRole("client");
              console.log("User role determined as client");
            } else if (adminResult.data) {
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
    console.log("Initializing auth state");
    
    // Always initialize auth state to prevent blank screens
    initializeAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          const role = session.user?.user_metadata?.role;
          if (role) {
            setUserRole(role as UserRole);
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      }
    );
    
    // Handle page visibility for better state management
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Window focused - checking auth state");
        initializeAuthState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
