
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";
import { toast } from "sonner";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initializationAttempted, setInitializationAttempted] = useState<boolean>(false);
  
  // Handle app initialization
  useEffect(() => {
    // Only initialize once
    if (initializationAttempted) return;
    setInitializationAttempted(true);
    
    const initializeApp = async () => {
      if (!isInitializing) return;
      
      const isAuthCallback = location.pathname.includes('/auth/callback');
      if (!isAuthCallback) {
        sessionStorage.removeItem('auth_callback_processed');
      }
      
      console.log('Initializing app...');
      console.log('Current path:', location.pathname);
      console.log('User authenticated:', !!user);
      console.log('User role:', userRole);
      
      const isConfigured = isAdminClientConfigured();
      setAdminConfigError(!isConfigured);
      
      // Initialize bucket with error handling and retries
      if (isConfigured) {
        try {
          await Promise.race([
            initializeBotLogosBucket(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Bucket initialization timeout')), 1500))
          ]);
        } catch (error) {
          console.error('Error initializing bot-logos bucket:', error);
          // Do not block app initialization for bucket errors
        }
      }
      
      // Finish initialization with aggressive timeout
      setTimeout(() => {
        if (isInitializing) {
          console.log('Completing initialization');
          setIsInitializing(false);
          setIsLoading(false);
        }
      }, 1000);
    };
    
    initializeApp();
    
    // Limit initialization time with aggressive timeout
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        console.warn('Force completing initialization due to timeout');
        setIsInitializing(false);
        setIsLoading(false);
        toast.warning("App initialization took longer than expected");
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, user, userRole, isLoading, isInitializing, setIsLoading, initializationAttempted]);
  
  // Additional safety timeouts for specific routes
  useEffect(() => {
    if (isLoading) {
      let timeoutDuration = 2000;
      
      // Shorter timeout for dashboard pages
      if (location.pathname.includes('/dashboard')) {
        timeoutDuration = 1000;
      }
      
      // Even shorter for client pages
      if (location.pathname.includes('/client/')) {
        timeoutDuration = 800;
      }
      
      const timer = setTimeout(() => {
        console.log(`Route-specific timeout triggered for ${location.pathname}`);
        setIsLoading(false);
      }, timeoutDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, location.pathname, setIsLoading]);
  
  return {
    adminConfigError,
    isInitializing,
    setIsInitializing
  };
}
