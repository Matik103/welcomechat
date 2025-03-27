
import { useCallback } from 'react';

export const useClientActivity = (clientId: string | undefined) => {
  const logClientActivity = useCallback(
    async (
      description: string,
      metadata?: Record<string, any>
    ): Promise<void> => {
      // Do nothing - activity logging is disabled
      return Promise.resolve();
    },
    [clientId]
  );

  return { 
    logClientActivity, 
    isLoading: false, 
    error: null 
  };
};

export default useClientActivity;
