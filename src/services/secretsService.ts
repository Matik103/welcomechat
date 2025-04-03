
import { supabase } from '@/integrations/supabase/client';
import { EDGE_FUNCTIONS_URL } from '@/config/env';

// Cache for secrets
const secretsCache: Record<string, string> = {};
let secretsLastUpdated = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Retrieve secrets from Supabase Edge Function
 */
export const getSecrets = async (keys: string[]): Promise<Record<string, string>> => {
  try {
    // Check if we have a fresh cached version
    const now = Date.now();
    if (secretsLastUpdated > 0 && now - secretsLastUpdated < CACHE_TTL) {
      // Return cached secrets that match the requested keys
      const cachedResult: Record<string, string> = {};
      let allFound = true;
      
      for (const key of keys) {
        if (secretsCache[key]) {
          cachedResult[key] = secretsCache[key];
        } else {
          allFound = false;
          break;
        }
      }
      
      if (allFound) {
        console.log('Using cached secrets');
        return cachedResult;
      }
    }
    
    // Call the get-secrets edge function
    const { data, error } = await supabase.functions.invoke('get-secrets', {
      body: { keys },
    });
    
    if (error) {
      console.error('Error retrieving secrets:', error);
      throw new Error(`Failed to retrieve secrets: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No secrets returned from edge function');
    }
    
    // Update cache
    for (const key in data) {
      secretsCache[key] = data[key];
    }
    
    secretsLastUpdated = now;
    
    return data as Record<string, string>;
  } catch (error) {
    console.error('Error in getSecrets:', error);
    throw error;
  }
};

/**
 * Get a specific secret
 */
export const getSecret = async (key: string): Promise<string | null> => {
  try {
    const secrets = await getSecrets([key]);
    return secrets[key] || null;
  } catch (error) {
    console.error(`Error getting secret ${key}:`, error);
    return null;
  }
};

/**
 * Clear the secrets cache
 */
export const clearSecretsCache = (): void => {
  for (const key in secretsCache) {
    delete secretsCache[key];
  }
  secretsLastUpdated = 0;
  console.log('Secrets cache cleared');
};

/**
 * Check if required secrets are available
 */
export const checkRequiredSecrets = async (keys: string[]): Promise<boolean> => {
  try {
    const secrets = await getSecrets(keys);
    for (const key of keys) {
      if (!secrets[key]) {
        console.warn(`Required secret ${key} not found`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error checking required secrets:', error);
    return false;
  }
};
