
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ensureResult } from '@/utils/supabaseTypeUtils';

export function useSupabaseQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, PostgrestError, T>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await queryFn();
      return ensureResult(result);
    },
    ...options,
  });
}

// Example usage in components:
// const { data } = useSupabaseQuery(['clients'], 
//   () => supabase.from('clients').select('*').throwOnError()
// );
