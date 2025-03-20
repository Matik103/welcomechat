
import { useState, useCallback } from 'react';
import { AccessStatus } from '@/types/document-processing';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { callRpcFunction } from '@/utils/rpcUtils';

export const useDriveAccessCheck = (documentId: number) => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AccessStatus>('unknown');

  const refreshStatus = useCallback(async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    try {
      const status = await callRpcFunction<AccessStatus>('get_document_access_status', {
        document_id: documentId
      });
      
      setAccessStatus(status || 'unknown');
      return status;
    } catch (error) {
      console.error('Error checking document access:', error);
      setAccessStatus('unknown');
      return 'unknown' as AccessStatus;
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const validateDriveLink = useCallback(async (link: string): Promise<AccessStatus> => {
    setIsValidating(true);
    try {
      // For now, we'll just return a mock validation result
      // In a real implementation, you would validate the link with Google Drive API
      const mockResult = 'granted' as AccessStatus;
      setValidationResult(mockResult);
      return mockResult;
    } catch (error) {
      console.error('Error validating drive link:', error);
      const errorResult = 'denied' as AccessStatus;
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    accessStatus,
    refreshStatus,
    isLoading,
    isValidating,
    validationResult,
    validateDriveLink
  };
};
