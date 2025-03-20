import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { determineUserRole } from '@/utils/authUtils';
import { UserRole } from '@/types/app';

export const useAuthInitialize = () => {
  const { setSession, setUser, setUserRole, setIsLoading, setAuthInitialized } = useAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          throw error;
        }
        
        // If there is a session, set the user and session
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Determine the user role
          try {
            // First check user_roles table
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle();
              
            if (roleError) {
              console.error("Error getting user role:", roleError);
            }
            
            // If role found in the database, use it
            if (roleData && roleData.role) {
              setUserRole(roleData.role as UserRole);
            } else {
              // Otherwise, determine role from other factors (like Google auth)
              const role = await determineUserRole(session.user);
              setUserRole(role);
              
              // Create a role record if one doesn't exist
              if (!roleData) {
                try {
                  await supabase
                    .from('user_roles')
                    .insert({
                      user_id: session.user.id,
                      role: role
                    });
                } catch (insertError) {
                  console.error("Error creating user role:", insertError);
                }
              }
            }
          } catch (roleErr) {
            console.error("Error determining user role:", roleErr);
            // Default to standard user role
            setUserRole('user');
          }
        } else {
          // No session
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        setSession(null);
        setUser(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setSession(session);
            setUser(session.user);
            
            // Determine the user role
            try {
              // Check user_roles table
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .maybeSingle();
                
              if (roleError) {
                console.error("Error getting user role (auth change):", roleError);
              }
              
              // If role found in database, use it
              if (roleData && roleData.role) {
                setUserRole(roleData.role as UserRole);
              } else {
                // Otherwise determine from other factors
                const role = await determineUserRole(session.user);
                setUserRole(role);
                
                // Create a role record if one doesn't exist
                if (!roleData) {
                  try {
                    await supabase
                      .from('user_roles')
                      .insert({
                        user_id: session.user.id,
                        role: role
                      });
                  } catch (insertError) {
                    console.error("Error creating user role (auth change):", insertError);
                  }
                }
              }
            } catch (roleErr) {
              console.error("Error determining user role (auth change):", roleErr);
              setUserRole('user');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      }
    );
    
    // Clean up the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setIsLoading, setAuthInitialized]);
};
