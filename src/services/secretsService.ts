
import { supabase } from '@/integrations/supabase/client';
import { setSecretsCache } from '@/config/env';

/**
 * Fetch secret values from Supabase Edge Function
 * @param secretNames Array of secret names to fetch
 * @returns Object with secret name-value pairs
 */
export const fetchSecrets = async (secretNames: string[]): Promise<Record<string, string>> => {
  try {
    console.log('Fetching secrets from Supabase Edge Function:', secretNames);
    
    const { data, error } = await supabase.functions.invoke('get-secrets', {
      body: { keys: secretNames }
    });
    
    if (error) {
      console.error('Error fetching secrets:', error);
      return {};
    }
    
    if (!data || typeof data !== 'object') {
      console.error('Invalid response from secrets function:', data);
      return {};
    }
    
    // Update secrets cache
    setSecretsCache(data as Record<string, string>);
    
    return data as Record<string, string>;
  } catch (error) {
    console.error('Error in fetchSecrets:', error);
    return {};
  }
};
