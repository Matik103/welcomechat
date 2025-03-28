
import { useCallback } from 'react';
import { ActivityType } from '@/types/activity';

export const useClientActivity = (clientId: string | undefined) => {
  // Completely empty implementation - activity logging is disabled
  const logClientActivity = useCallback(
    async (
      type?: ActivityType,
      description?: string,
      metadata: any = {}
    ): Promise<void> => {
      // Just log to console instead of trying to insert into activities table
      console.log(`[Activity Log] ${type}: ${description}`, {
        clientId,
        type,
        description,
        metadata
      });
      
      // Return without actually writing to database
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
