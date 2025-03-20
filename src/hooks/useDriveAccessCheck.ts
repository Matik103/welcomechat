
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AccessStatus } from '@/types/extended-supabase';
import { callRpcFunction } from '@/utils/rpcUtils';
import { toast } from 'sonner';

export const useDriveAccessCheck = (linkId: number) => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('unknown');
  const [isLoading, setIsLoading] = useState(false);

  // Query to check document link access status
  const { data: validationResult, isLoading: isValidating, refetch } = useQuery({
    queryKey: ['driveAccessCheck', linkId],
    queryFn: async () => {
      if (!linkId) return { status: 'unknown' as AccessStatus };

      try {
        const result = await callRpcFunction<{ status: AccessStatus }>('check_drive_link_access', {
          link_id: linkId
        });
        
        setAccessStatus(result?.status || 'unknown');
        return result;
      } catch (error) {
        console.error('Error checking drive link access:', error);
        setAccessStatus('inaccessible');
        return { status: 'inaccessible' as AccessStatus };
      }
    },
    enabled: !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Manually refresh access status
  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const result = await refetch();
      if (result.data?.status) {
        setAccessStatus(result.data.status);
        toast.success(`Access status updated: ${result.data.status}`);
      }
    } catch (error) {
      console.error('Error refreshing access status:', error);
      toast.error('Failed to refresh access status');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate a drive link directly
  const validateDriveLink = async (link: string): Promise<AccessStatus> => {
    if (!link) return 'unknown';
    
    try {
      const result = await callRpcFunction<{ status: AccessStatus }>('validate_drive_link', {
        link: link
      });
      
      return result?.status || 'unknown';
    } catch (error) {
      console.error('Error validating drive link:', error);
      return 'inaccessible';
    }
  };

  return {
    accessStatus,
    refreshStatus,
    isLoading,
    isValidating,
    validationResult: validationResult?.status || 'unknown',
    validateDriveLink
  };
};
