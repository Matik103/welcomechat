
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Function to check user role from the user_roles table
  const checkUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, client_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error checking user role:', error);
        return { role: null, clientId: null };
      }

      return { 
        role: data?.role as 'admin' | 'client' | null,
        clientId: data?.client_id
      };
    } catch (err) {
      console.error('Exception checking user role:', err);
      return { role: null, clientId: null };
    }
  }, []);

  // Try to load from session storage first for instant UI
  useEffect(() => {
    const cachedState = sessionStorage.getItem('auth_state_cache');
    if (cachedState) {
      try {
        const state = JSON.parse(cachedState);
        if (state.role) {
          setUserRole(state.role);
          // This will get overwritten if needed when the real auth check completes
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Error parsing cached auth state:', e);
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check user role if we have a user
          if (currentSession.user) {
            const { role, clientId: userClientId } = await checkUserRole(currentSession.user.id);
            setUserRole(role);
            setClientId(userClientId);
          }
        }
      } catch (err) {
        console.error('Error in auth initialization:', err);
      } finally {
        // Always complete loading after a reasonable time
        setIsLoading(false);
      }
    };

    const initTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    initializeAuth();

    // Set up subscription for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user || null);

        // Check user role if we have a user
        if (newSession?.user) {
          const { role, clientId: userClientId } = await checkUserRole(newSession.user.id);
          setUserRole(role);
          setClientId(userClientId);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setClientId(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(initTimeout);
      subscription?.unsubscribe();
    };
  }, [checkUserRole]);

  return { user, session, isLoading, userRole, clientId };
}
