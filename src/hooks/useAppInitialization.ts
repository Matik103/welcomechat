
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isAdminClientConfigured, initializeBotLogosBucket } from "@/integrations/supabase/client-admin";
import { toast } from "sonner";

export function useAppInitialization(isLoading: boolean, user: any, userRole: any, setIsLoading: (value: boolean) => void) {
  const location = useLocation();
  const [adminConfigError, setAdminConfigError] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initializationAttempted, setInitializationAttempted] = useState<boolean>(false);
  const [initializationErrors, setInitializationErrors] = useState<string[]>([]);
  
  // Handle app initialization
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
        const isConfigured = isAdminClientConfigured();
        setAdminConfigError(!isConfigured);
        
        if (isConfigured) {
          // Initialize bucket with error handling and retries
          try {
            await Promise.race([
              initializeBotLogosBucket(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Bucket initialization timeout')), 2500)
              )
            ]);
            console.log('Bot logos bucket initialized successfully');
          } catch (error) {
            console.error('Error initializing bot-logos bucket:', error);
            setInitializationErrors(prev => [...prev, 'Failed to initialize storage bucket']);
            // Continue despite bucket init errors
          }
        } else {
          console.warn('Admin client not configured - some features may not work');
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        setInitializationErrors(prev => [
          ...prev, 
          `Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ]);
      } finally {
        // Always complete initialization to avoid being stuck
        console.log('Completing initialization');
        setIsInitializing(false);
        setIsLoading(false);
      }
    };
    
    initializeApp();
    
    // Strict timeout for initialization
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        console.warn('Force completing initialization due to timeout');
        setIsInitializing(false);
        setIsLoading(false);
        toast.warning("App initialization took longer than expected, some features may not work properly");
        
        // Add diagnostic info to help troubleshoot
        setInitializationErrors(prev => [
          ...prev,
          'Initialization timeout exceeded (3s)'
        ]);
      }
    }, 3000);
    
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
    setIsInitializing,
    initializationErrors
  };
}
