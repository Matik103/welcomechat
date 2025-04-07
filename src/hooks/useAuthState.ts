
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Function to check user role from the user_roles table
  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking user role for user ID:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking user role:', error);
        return { role: null, clientId: null };
      }

      console.log('Found user role data:', data);
      return { 
        role: data?.role as 'admin' | 'client' | null,
        clientId: data?.client_id
      };
    } catch (err) {
      console.error('Exception checking user role:', err);
      return { role: null, clientId: null };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing auth state');
        
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setSession(null);
          setUserRole(null);
          setClientId(null);
          return;
        }

        if (currentSession) {
          console.log('Session found');
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check user role if we have a user
          if (currentSession.user) {
            const { role, clientId: userClientId } = await checkUserRole(currentSession.user.id);
            setUserRole(role);
            setClientId(userClientId);
            console.log(`User role set to: ${role}, client ID: ${userClientId}`);
          }
        } else {
          console.log('No session found');
          setUser(null);
          setSession(null);
          setUserRole(null);
          setClientId(null);
        }
      } catch (err) {
        console.error('Error in auth initialization:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up subscription for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user || null);

        // Check user role if we have a user
        if (newSession?.user) {
          const { role, clientId: userClientId } = await checkUserRole(newSession.user.id);
          setUserRole(role);
          setClientId(userClientId);
          console.log(`User role set to: ${role}, client ID: ${userClientId}`);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setClientId(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, session, isLoading, userRole, clientId };
}
