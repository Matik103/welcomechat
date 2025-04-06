
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(!isAdminClientConfigured());
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initializationAttempted, setInitializationAttempted] = useState<boolean>(false);
  const [initializationErrors, setInitializationErrors] = useState<string[]>([]);
  
  // Use refs to track initialization state without causing rerenders
  const initializationRef = useRef<boolean>(false);
  
  // Optimized app initialization
  useEffect(() => {
    // Only initialize once and prevent duplicate initialization
    if (initializationAttempted || initializationRef.current) return;
    
    // Mark initialization as attempted
    initializationRef.current = true;
    setInitializationAttempted(true);
    console.log('Starting app initialization...');
    
    const initializeApp = async () => {
      if (!isInitializing) return;
      
      const isAuthCallback = location.pathname.includes('/auth/callback');
      if (!isAuthCallback) {
        // Only clear callback flag if we're not on a callback URL
        sessionStorage.removeItem('auth_callback_processed');
      } else {
        // On callback URL, don't double-initialize
        console.log('Skipping initialization on auth callback');
        setIsInitializing(false);
        setIsLoading(false);
        return;
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
