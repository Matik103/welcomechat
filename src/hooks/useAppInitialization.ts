
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  // Handle app initialization
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
      console.log('Loading state:', isLoading);
      
      const isConfigured = isAdminClientConfigured();
      setAdminConfigError(!isConfigured);
      
      if (isConfigured) {
        try {
          await initializeBotLogosBucket();
        } catch (error) {
          console.error('Error initializing bot-logos bucket:', error);
        }
      }
      
      setIsInitializing(false);
    };
    
    initializeApp();
  }, [location.pathname, user, userRole, isLoading, isInitializing, setIsLoading]);
  
  // Timeout for dashboard loading
  useEffect(() => {
    if (isLoading && location.pathname.includes('/dashboard')) {
      const timer = setTimeout(() => {
        console.log('Forcing loading state to complete due to dashboard path');
        setIsLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, location.pathname, setIsLoading]);
  
  // Force loading state completion after initialization
  useEffect(() => {
    if (isLoading && !isInitializing) {
      const forceLoadingTimeout = setTimeout(() => {
        console.log('Forcing loading state to complete after timeout');
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(forceLoadingTimeout);
    }
  }, [isLoading, isInitializing, setIsLoading]);
  
  return {
    adminConfigError,
    isInitializing,
    setIsInitializing
  };
}
