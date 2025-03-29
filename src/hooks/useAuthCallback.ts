
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '@/contexts/AuthContext';
import { getUserRole } from '@/services/authService';

interface UseAuthCallbackProps {
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthCallback = ({
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading
}: UseAuthCallbackProps) => {
  useEffect(() => {
    // Only run this if we're on the callback URL
    if (!isCallbackUrl) return;
    
    const handleAuthCallback = async () => {
      // Avoid processing the callback multiple times
      const processed = sessionStorage.getItem('auth_callback_processed');
      if (processed) return;
      
      setIsLoading(true);
      
      try {
        console.log("Processing auth callback...");
        // Try to get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log("Auth callback: Got session for user", data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          
          // Get user role
          const role = await getUserRole();
          console.log("Auth callback: User role determined as:", role);
          setUserRole(role);
          
          // Mark callback as processed to avoid duplicate processing
          sessionStorage.setItem('auth_callback_processed', 'true');
          
          // Redirect to appropriate page after callback is processed
          if (typeof window !== 'undefined') {
            const redirectPath = role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
            console.log("Auth callback: Redirecting to", redirectPath);
            window.location.href = redirectPath;
          }
        } else {
          console.warn("Auth callback: No session found");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [isCallbackUrl, setIsLoading, setSession, setUser, setUserRole]);
};
