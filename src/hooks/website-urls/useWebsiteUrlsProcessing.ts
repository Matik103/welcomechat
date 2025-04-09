
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WebsiteUrl } from '@/types/website-url';
import { toast } from 'sonner';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';

export function useWebsiteUrlsProcessing(clientId: string) {
  const queryClient = useQueryClient();
  const storeWebsiteContent = useStoreWebsiteContent(clientId);
  
  // Create a mutation for processing website URLs with debouncing
  const processWebsiteUrlMutation = useMutation({
    mutationFn: async (website: WebsiteUrl) => {
      toast.info(`Processing website: ${website.url}...`);
      return storeWebsiteContent.mutateAsync(website);
    },
    onSuccess: () => {
      // Use invalidateQueries with selective key invalidation
      queryClient.invalidateQueries({ 
        queryKey: ['websiteUrls', clientId],
        exact: true // Only invalidate exact matches to prevent cascade refreshes
      });
      toast.success('Website content processed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to process website: ${error.message}`);
    }
  });

  return {
    processWebsiteUrl: processWebsiteUrlMutation.mutateAsync,
    processWebsiteUrlMutation
  };
}
