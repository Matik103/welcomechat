
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/types/auth";
import { determineUserRole, getDashboardRoute } from "@/utils/authUtils";

type AuthCallbackProps = {
  isCallbackUrl: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export const useAuthCallback = ({
  isCallbackUrl,
  setSession,
  setUser,
  setUserRole,
  setIsLoading
}: AuthCallbackProps) => {
  // Use a navigation function that doesn't rely on react-router
  const navigate = (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  };

  useEffect(() => {
    if (!isCallbackUrl) return;
    
    // Set a flag in sessionStorage to prevent processing the callback multiple times
    const callbackProcessed = sessionStorage.getItem('auth_callback_processed');
    if (callbackProcessed === 'true') {
      console.log("Auth callback already processed, skipping");
      setIsLoading(false); // Ensure loading state is cleared
      return;
    }
    
    // Set a processing flag to indicate we're handling the callback
    sessionStorage.setItem('auth_callback_processing', 'true');
    
    // Keep the loading state true while processing callback
    setIsLoading(true);
    
    const handleCallback = async () => {
      try {
        console.log("Auth callback processing started");
        
        // Get the session from the URL
        const { data: { session: callbackSession }, error: sessionError } = 
          await supabase.auth.getSession();
          
        if (sessionError || !callbackSession) {
          console.error("Error getting session from callback URL:", sessionError);
          sessionStorage.removeItem('auth_callback_processing');
          navigate('/auth', { replace: true });
          setIsLoading(false);
          return;
        }
        
        // Set session and user data immediately
        setSession(callbackSession);
        setUser(callbackSession.user);
        
        // Check if Google SSO user by looking at provider in app_metadata
        const isGoogleUser = callbackSession.user?.app_metadata?.provider === 'google';
        
        console.log("Google SSO check:", isGoogleUser, callbackSession.user?.app_metadata);
        
        // For Google SSO users, always set role as admin and redirect to admin dashboard
        if (isGoogleUser) {
          console.log("Google SSO user detected in callback, setting role as admin");
          setUserRole('admin');
          sessionStorage.setItem('user_role_set', 'admin');
          
          // Mark callback as processed to prevent re-processing
          sessionStorage.setItem('auth_callback_processed', 'true');
          
          // Clear processing flag before navigation
          sessionStorage.removeItem('auth_callback_processing');
          
          // Navigate directly to admin dashboard
          navigate('/admin/dashboard', { replace: true });
          
          // Set loading to false after navigation is queued
          setIsLoading(false);
        } else {
          // For non-Google users, check client status
          const userRole = await determineUserRole(callbackSession.user);
          
          setUserRole(userRole);
          
          // Store the role in sessionStorage
          sessionStorage.setItem('user_role_set', userRole);
          
          // Mark callback as processed to prevent re-processing
          sessionStorage.setItem('auth_callback_processed', 'true');
          
          console.log(`User identified as ${userRole}, redirecting to appropriate dashboard`);
          
          // Get the appropriate dashboard route based on role
          const dashboardRoute = getDashboardRoute(userRole);
          
          // Clear processing flag before navigation
          sessionStorage.removeItem('auth_callback_processing');
          
          // Navigate to the appropriate dashboard
          navigate(dashboardRoute, { replace: true });
          
          // Set loading to false after navigation is queued
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        sessionStorage.removeItem('auth_callback_processing');
        navigate('/auth', { replace: true });
        setIsLoading(false);
      }
    };
    
    // Execute the callback handler with a small delay to ensure the session is available
    const timeoutId = setTimeout(() => {
      handleCallback();
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isCallbackUrl, setSession, setUser, setUserRole, setIsLoading]);
};
