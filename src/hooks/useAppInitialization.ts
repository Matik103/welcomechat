
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [bucketInitialized, setBucketInitialized] = useState<boolean>(false);
  
  // Check if this is initial auth or navigation
  const isInitialAuth = !sessionStorage.getItem('initial_auth_complete');
  
  // Handle app initialization - only once
  useEffect(() => {
    const initializeApp = async () => {
      if (!isInitializing) return;
      
      const isAuthCallback = location.pathname.includes('/auth/callback');
      if (!isAuthCallback) {
        sessionStorage.removeItem('auth_callback_processed');
      }
      
      console.log('Current path:', location.pathname);
      console.log('User authenticated:', !!user);
      console.log('User role:', userRole);
      
      const isConfigured = isAdminClientConfigured();
      setAdminConfigError(!isConfigured);
      
      if (isConfigured && !bucketInitialized) {
        try {
          await initializeBotLogosBucket();
          setBucketInitialized(true);
        } catch (error) {
          console.error('Error initializing bot-logos bucket:', error);
        }
      }
      
      setIsInitializing(false);
    };
    
    initializeApp();
  }, [location.pathname, user, userRole, isInitializing, bucketInitialized]);
  
  // Force loading state completion after initialization for dashboard paths
  useEffect(() => {
    // Only apply timeout during initial auth
    if (isLoading && isInitialAuth && location.pathname.includes('/dashboard')) {
      const timer = setTimeout(() => {
        console.log('Forcing loading state to complete due to dashboard path');
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, location.pathname, setIsLoading, isInitialAuth]);
  
  // General loading timeout - only during initial auth
  useEffect(() => {
    if (isLoading && !isInitializing && isInitialAuth) {
      const forceLoadingTimeout = setTimeout(() => {
        console.log('Forcing loading state to complete after initialization timeout');
        setIsLoading(false);
        // Mark initial auth as complete
        sessionStorage.setItem('initial_auth_complete', 'true');
      }, 5000);
      
      return () => clearTimeout(forceLoadingTimeout);
    }
  }, [isLoading, isInitializing, setIsLoading, isInitialAuth]);
  
  return {
    adminConfigError,
    isInitializing,
    setIsInitializing
  };
}
