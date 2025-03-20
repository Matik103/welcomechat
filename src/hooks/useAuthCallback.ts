
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '@/utils/authUtils';
import { UserRole } from '@/types/app';

export const useAuthCallback = () => {
  const { setSession, setUser, setUserRole, setIsLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // One-time check on initial load
    const checkAuthState = async () => {
      setIsLoading(true);
      try {
        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Auth callback - Session error:", sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log("Auth callback - No session found");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setIsLoading(false);
          return;
        }
        
        // Set the session and user in context
        setSession(session);
        setUser(session.user);
        
        // Determine the user's role
        if (session.user) {
          try {
            // Check user roles table
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (roleError) {
              console.error("Auth callback - Error fetching role:", roleError);
            }
            
            // If role found in the database, use it
            if (roleData && roleData.role) {
              setUserRole(roleData.role as UserRole);
              console.log("User role from database:", roleData.role);
              
              // Redirect to the appropriate dashboard if on the auth page
              const currentPath = window.location.pathname;
              if (currentPath === '/auth') {
                const dashboardPath = getDashboardRoute(roleData.role as UserRole);
                navigate(dashboardPath);
              }
              
              setIsLoading(false);
              return;
            }
            
            // Default fallback if no role found - treat as basic user
            setUserRole('user');
            console.log("No role found in database, defaulting to 'user'");
          } catch (err) {
            console.error("Auth callback - Error determining role:", err);
            setUserRole('user');
          }
        }
      } catch (err: any) {
        console.error("Auth callback - General error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthState();
  }, [setSession, setUser, setUserRole, setIsLoading, navigate]);
  
  return { error };
};
