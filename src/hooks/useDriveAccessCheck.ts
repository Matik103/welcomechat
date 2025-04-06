
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AccessStatus = 'accessible' | 'inaccessible' | 'unknown' | 'pending' | 'granted' | 'denied';

export interface DriveAccessResult {
  accessLevel: 'public' | 'private' | 'unknown';
  fileType: 'file' | 'folder' | 'unknown';
  isAccessible: boolean;
  error?: string;
}

export const useDriveAccessCheck = (documentId: number) => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<DriveAccessResult | null>(null);
  
  // Function to check access status
  const checkAccessStatus = async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    
    try {
      // First try to get the document link from the database
      const { data: documentData, error: documentError } = await supabase
        .from('document_links')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (documentError || !documentData) {
        console.error('Error fetching document:', documentError);
        setAccessStatus('unknown');
        setIsLoading(false);
        return;
      }
      
      // Check if it's a Google Drive link
      const isGoogleDriveLink = documentData.document_type?.startsWith('google_') || 
                               documentData.link.includes('drive.google.com') || 
                               documentData.link.includes('docs.google.com');
      
      if (isGoogleDriveLink) {
        // Use the Drive access check API
        const { data, error } = await supabase.functions.invoke('check-drive-access', {
          body: { url: documentData.link }
        });
        
        if (error) {
          console.error('Error checking drive access:', error);
          setAccessStatus('unknown');
        } else if (data && typeof data === 'object') {
          setValidationResult(data as DriveAccessResult);
          setAccessStatus(data.isAccessible ? 'granted' : 'denied');
        }
      } else {
        // For non-Google Drive links, check if URL is accessible
        try {
          // Simple URL validation
          new URL(documentData.link);
          
          // Try to check if URL is accessible (this is a simple check and might not work for all URLs)
          const isHttpUrl = documentData.link.startsWith('http');
          
          if (isHttpUrl) {
            try {
              const response = await fetch(documentData.link, { method: 'HEAD', mode: 'no-cors' });
              setAccessStatus('accessible');
            } catch (err) {
              // If we can't access it directly, we just don't know
              setAccessStatus('unknown');
            }
          } else {
            // If it's not an HTTP URL, we don't know
            setAccessStatus('unknown');
          }
        } catch (err) {
          // Invalid URL
          setAccessStatus('inaccessible');
        }
      }
    } catch (error) {
      console.error('Error in drive access check:', error);
      setAccessStatus('unknown');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial check
  useEffect(() => {
    if (documentId) {
      checkAccessStatus();
    }
  }, [documentId]);
  
  // Function to manually refresh status
  const refreshStatus = () => {
    checkAccessStatus();
  };
  
  // Function to validate a drive link without needing a document ID
  const validateDriveLink = async (link: string): Promise<DriveAccessResult> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-drive-access', {
        body: { url: link }
      });
      
      if (error) {
        console.error('Error validating drive link:', error);
        return {
          accessLevel: 'unknown',
          fileType: 'unknown',
          isAccessible: false,
          error: error.message
        };
      }
      
      const result = data as DriveAccessResult;
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Exception validating drive link:', error);
      return {
        accessLevel: 'unknown',
        fileType: 'unknown',
        isAccessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    accessStatus,
    validationResult,
    isLoading,
    refreshStatus,
    validateDriveLink
  };
};
