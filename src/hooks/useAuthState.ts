
import { useState, useEffect, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);

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
          setUserRole(role);
          console.log("User role set from metadata:", role);
        } else {
          // If role not in metadata, try to determine from client relationship
          const clientLookupPromise = supabase
            .from("clients")
            .select("id")
            .eq("user_id", data.session.user.id)
            .maybeSingle();
            
          const adminLookupPromise = supabase
            .from("admins")
            .select("id")
            .eq("user_id", data.session.user.id)
            .maybeSingle();
            
          const [clientResult, adminResult] = await Promise.all([
            clientLookupPromise,
            adminLookupPromise,
          ]);
          
          if (clientResult.data) {
            setUserRole("client");
            console.log("User role determined as client");
          } else if (adminResult.data) {
            setUserRole("admin");
            console.log("User role determined as admin");
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
            setUserRole(role);
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

  return { user, userRole, isLoading, setIsLoading, session };
}
