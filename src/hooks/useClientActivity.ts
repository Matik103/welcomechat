
import { useCallback } from 'react';

export const useClientActivity = (clientId: string | undefined) => {
  // Completely empty implementation - activity logging is disabled
  const logClientActivity = useCallback(
    async (): Promise<void> => {
      // Do nothing - activity logging is completely disabled
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
