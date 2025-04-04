
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initializationAttempted, setInitializationAttempted] = useState<boolean>(false);
  const [initializationErrors, setInitializationErrors] = useState<string[]>([]);
  
  // Optimized app initialization
  useEffect(() => {
    // Only initialize once
    if (initializationAttempted) return;
    
    setInitializationAttempted(true);
    console.log('Starting app initialization...');
    
    const initializeApp = async () => {
      if (!isInitializing) return;
      
      const isAuthCallback = location.pathname.includes('/auth/callback');
      if (!isAuthCallback) {
        sessionStorage.removeItem('auth_callback_processed');
      }
      
      console.log('Current path:', location.pathname);
      console.log('User authenticated:', !!user);
      console.log('User role:', userRole);
      
      try {
        // Check if admin client is configured, but don't block on it
        const isConfigured = isAdminClientConfigured();
        setAdminConfigError(!isConfigured);
        
        if (isConfigured) {
          // Initialize bucket but don't wait too long
          try {
            const bucketInitPromise = initializeBotLogosBucket();
            // Use a shorter timeout
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Bucket initialization timeout')), 1000)
            );
            
            await Promise.race([bucketInitPromise, timeoutPromise]);
            console.log('Bot logos bucket initialized successfully');
          } catch (error) {
            console.warn('Non-blocking bucket initialization error (continuing):', error);
          }
        }
      } catch (error) {
        console.warn('Non-critical initialization error (continuing):', error);
      } finally {
        // Always complete initialization to avoid being stuck
        console.log('Completing initialization');
        setIsInitializing(false);
        setIsLoading(false);
      }
    };
    
    // Start initialization but don't block UI
    initializeApp();
    
    // Short timeout for initialization - simply complete it after 1 second
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        console.log('Completing initialization after timeout');
        setIsInitializing(false);
        setIsLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, user, userRole, isLoading, isInitializing, setIsLoading, initializationAttempted]);
  
  return {
    adminConfigError,
    isInitializing,
    setIsInitializing,
    initializationErrors
  };
}
