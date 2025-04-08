
import { supabase } from '@/integrations/supabase/client';
import { SUPABASE_URL, RAPIDAPI_KEY } from '@/config/env';

/**
 * Validates that all required environment variables are set
 * @returns Object containing validation results
 */
export const validateEnvironment = () => {
  const results = {
    supabase: !!SUPABASE_URL,
    rapidApi: !!RAPIDAPI_KEY,
  };
  
  return {
    allValid: Object.values(results).every(Boolean),
    results
  };
};

/**
 * Checks the health of various system components
 */
export const checkSystemHealth = async () => {
  const results = {
    environment: validateEnvironment(),
    database: await checkDatabaseConnection(),
    storage: await checkStorageAccess(),
    secrets: await checkSecretsAccess()
  };
  
  return {
    allHealthy: Object.values(results).every(r => 
      typeof r === 'object' ? r.allValid || r.success : !!r
    ),
    results
  };
};

/**
 * Checks if the database connection is working
 */
const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);
    
    return { 
      success: !error,
      error: error?.message
    };
  } catch (err) {
    return { 
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

/**
 * Checks if storage access is working
 */
const checkStorageAccess = async () => {
  try {
    const { data, error } = await supabase
      .storage
      .getBucket('client_documents');
    
    return { 
      success: !error, 
      error: error?.message
    };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

/**
 * Checks if secrets access is working
 */
const checkSecretsAccess = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-secrets', {
      body: { keys: ['VITE_RAPIDAPI_KEY'] }
    });
    
    return { 
      success: !error,
      hasSecrets: !!data?.VITE_RAPIDAPI_KEY,
      error: error?.message
    };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};
