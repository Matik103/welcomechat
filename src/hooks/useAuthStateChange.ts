import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { determineUserRole } from '@/utils/authUtils';
import { UserRole } from '@/types/app';

export const useAuthStateChange = () => {
  const { setSession, setUser, setUserRole } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setSession(session);
            setUser(session.user);
            
            // Determine the user role
            try {
              // Check user_roles table first
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .maybeSingle();
                
              if (roleError) {
                console.error("Error getting user role:", roleError);
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
                    console.error("Error creating user role:", insertError);
                  }
                }
              }
            } catch (err) {
              console.error("Error determining user role:", err);
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
  }, [setSession, setUser, setUserRole]);
};
