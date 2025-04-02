
import { useState } from 'react';
import { DocumentProcessingService } from '@/utils/DocumentProcessingService';
import { DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DocumentProcessingResult | null>(null);
  const [bucketError, setBucketError] = useState<string | null>(null);

  // Check if the document-storage bucket exists
  const checkBucketExists = async (): Promise<boolean> => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error("Error checking buckets:", error);
        setBucketError(error.message);
        return false;
      }
      
      const exists = buckets?.some(bucket => bucket.name === 'document-storage');
      
      if (!exists) {
        setBucketError("The document-storage bucket does not exist");
      } else {
        setBucketError(null);
      }
      
      return exists;
    } catch (err) {
      console.error("Error in checkBucketExists:", err);
      setBucketError(err instanceof Error ? err.message : "Unknown error checking bucket");
      return false;
    }
  };

  const fixPermissions = async (): Promise<boolean> => {
    try {
      const result = await fixDocumentLinksRLS();
      return result.success;
    } catch (error) {
      console.error("Error fixing permissions:", error);
      return false;
    }
  };

  const uploadDocument = async (file: File): Promise<void> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // First check if bucket exists
      const bucketExists = await checkBucketExists();
      
      if (!bucketExists) {
        // Try to fix permissions and create bucket
        const fixed = await fixPermissions();
        if (!fixed) {
          throw new Error("Could not create or access the document-storage bucket. Please contact an administrator.");
        }
      }
      
      // First, get the agent name
      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('name')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .limit(1)
        .maybeSingle();
      
      if (agentError) {
        console.error('Failed to get agent name:', agentError);
        throw new Error(`Failed to get agent name: ${agentError.message}`);
      }
      
      // Use a default agent name if none is found
      const agentName = agentData?.name || 'AI Assistant';
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      // Process the document - pass just the file and clientId
      const result = await DocumentProcessingService.processDocument(
        file,
        clientId
      );
      
      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        // Create client activity with enum type
        await createClientActivity(
          clientId,
          agentName,
          ActivityType.DOCUMENT_ADDED,
          `Document uploaded: ${file.name}`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type
          }
        );
        
        setUploadResult(result);
        toast.success('Document uploaded successfully');
      } else {
        setUploadResult({
          success: false,
          error: result.error,
          processed: 0,
          failed: 1
        });
        throw new Error(result.error || 'Failed to process document');
      }
    } catch (error) {
      console.error('Error in uploadDocument:', error);

      // Check if this is a permission related error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isPossiblePermissionError = 
        errorMessage.includes('permission denied') || 
        errorMessage.includes('not authorized') || 
        errorMessage.includes('violates row-level security') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('bucket') ||
        errorMessage.includes('storage');
      
      // Let the user know this could be a permissions issue
      if (isPossiblePermissionError) {
        try {
          // Automatically try to fix the issue
          await fixPermissions();
          toast.error('Permission error detected. Permissions have been automatically updated. Please try again.');
        } catch (fixError) {
          toast.error('Permission error detected. Try using the "Fix Security Permissions" button.');
        }
      } else {
        toast.error(`Error uploading document: ${errorMessage}`);
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadResult,
    bucketError,
    fixPermissions
  };
}
