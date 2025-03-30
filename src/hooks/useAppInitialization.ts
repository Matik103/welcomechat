
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initAttempted, setInitAttempted] = useState<boolean>(false);
  
  // Handle app initialization
  useEffect(() => {
    const initializeApp = async () => {
      if (initAttempted || !isInitializing) return;
      
      setInitAttempted(true);
      
      const isAuthCallback = location.pathname.includes('/auth/callback');
      if (!isAuthCallback) {
        sessionStorage.removeItem('auth_callback_processed');
      }
      
      console.log('App initialization starting');
      console.log('Current path:', location.pathname);
      console.log('User authenticated:', !!user);
      console.log('User role:', userRole);
      console.log('Loading state:', isLoading);
      
      try {
        const isConfigured = isAdminClientConfigured();
        setAdminConfigError(!isConfigured);
        
        if (isConfigured) {
          try {
            await initializeBotLogosBucket();
            console.log('Bot logos bucket initialized');
          } catch (error) {
            console.error('Error initializing bot-logos bucket:', error);
          }
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setIsInitializing(false);
        console.log('App initialization complete');
      }
    };
    
    initializeApp();
  }, [location.pathname, user, userRole, isLoading, isInitializing, initAttempted, setIsLoading]);
  
  // Force loading state completion for dashboard after a timeout
  useEffect(() => {
    if (isLoading && location.pathname.includes('/dashboard')) {
      console.log('Setting dashboard loading timeout...');
      
      const timer = setTimeout(() => {
        console.log('Dashboard loading timeout triggered - completing loading state');
        setIsLoading(false);
      }, 5000); // 5 second timeout for dashboard loading
      
      return () => {
        console.log('Clearing dashboard loading timeout');
        clearTimeout(timer);
      };
    }
  }, [isLoading, location.pathname, setIsLoading]);
  
  // Force loading state completion after initialization
  useEffect(() => {
    if (isLoading && !isInitializing) {
      console.log('Setting general loading timeout after initialization...');
      
      const forceLoadingTimeout = setTimeout(() => {
        console.log('General loading timeout triggered after initialization');
        setIsLoading(false);
      }, 8000); // 8 second timeout
      
      return () => {
        console.log('Clearing general loading timeout');
        clearTimeout(forceLoadingTimeout);
      };
    }
  }, [isLoading, isInitializing, setIsLoading]);
  
  return {
    adminConfigError,
    isInitializing,
    setIsInitializing
  };
}
