
import { validateEnvironment, SUPABASE_URL, RAPIDAPI_KEY, APP_VERSION, IS_PRODUCTION } from '@/config/env';

/**
 * Performs a health check of the application environment
 * Can be used to verify the application is correctly configured
 */
export const performHealthCheck = async () => {
  const environment = validateEnvironment();
  const browserInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    memory: 'memory' in performance ? performance.memory : 'Not available',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  const supabaseAvailable = await checkSupabaseConnection();

  return {
    timestamp: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      environment: IS_PRODUCTION ? 'production' : 'development',
    },
    config: {
      supabaseUrl: SUPABASE_URL ? 'Configured' : 'Missing',
      rapidApiKey: RAPIDAPI_KEY ? 'Configured' : 'Missing',
    },
    environment,
    browser: browserInfo,
    services: {
      supabase: supabaseAvailable ? 'Available' : 'Unavailable'
    }
  };
};

/**
 * Checks if we can connect to Supabase
 */
async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.from('document_content').select('id').limit(1);
    return !error;
  } catch (e) {
    console.error('Supabase connectivity check failed:', e);
    return false;
  }
}

/**
 * Add a global health check endpoint
 * Can be accessed by calling window.checkAppHealth() in the console
 */
export const exposeHealthCheck = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.checkAppHealth = async () => {
      const health = await performHealthCheck();
      console.table({
        'App Version': health.app.version,
        'Environment': health.app.environment,
        'Supabase': health.services.supabase,
        'Config Valid': health.environment.valid,
        'Issues': health.environment.issues.join(', ') || 'None'
      });
      
      console.group('Full Health Report');
      console.log(health);
      console.groupEnd();
      
      return health;
    };
    
    // Add version to window object for easier checking
    // @ts-ignore
    window.app = { 
      version: APP_VERSION,
      environment: IS_PRODUCTION ? 'production' : 'development'
    };
  }
};
