
import { useState, useCallback } from 'react';

// This is a temporary placeholder hook since client_activities table has been removed
export const useClientActivity = (clientId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logClientActivity = useCallback(
    async (
      activity_type: string,
      description: string,
      metadata?: Record<string, any>
    ): Promise<void> => {
      if (!clientId) {
        console.warn('No client ID provided for activity logging');
        return;
      }

      // Instead of saving to database, we just log to console
      console.log(`[ACTIVITY LOG] ${activity_type}: ${description}`, {
        clientId,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      // Return void to match the expected Promise<void> type
      return Promise.resolve();
    },
    [clientId]
  );

  return { logClientActivity, isLoading, error };
};

export default useClientActivity;
