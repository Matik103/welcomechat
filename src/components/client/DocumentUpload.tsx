
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useUnifiedDocumentUpload } from '../../hooks/useUnifiedDocumentUpload';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { DOCUMENTS_BUCKET, ensureBucketExists, ensureAllBucketsExist, handleBucketNotFoundError } from '@/utils/ensureStorageBuckets';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploadProps {
  clientId: string;
  onUploadComplete?: (result: { success: boolean; documentId?: string; error?: string; publicUrl?: string; fileName?: string }) => void;
}

export function DocumentUpload({ clientId, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [isBucketVerified, setIsBucketVerified] = useState(false);
  const [isFixingBucket, setIsFixingBucket] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  const { upload } = useUnifiedDocumentUpload({
    clientId,
    onSuccess: (result) => {
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    },
    onProgress: (progress) => {
      setUploadProgress(progress);
    }
  });
  
  // Verify bucket exists on component mount and try to fix connection issues
  useEffect(() => {
    const verifyAndFixBuckets = async () => {
      setIsCheckingConnection(true);
      try {
        console.log("Checking Supabase connection and storage buckets...");
        
        // First try to refresh the session to ensure connection is active
        try {
          const { data } = await supabase.auth.refreshSession();
          console.log("Auth refresh result:", data ? "Success" : "No data");
        } catch (refreshErr) {
          console.warn("Session refresh error:", refreshErr);
          // Continue anyway, the bucket check will try again
        }
        
        // Then verify all buckets exist
        const allBucketsExist = await ensureAllBucketsExist();
        
        if (allBucketsExist) {
          console.log("All storage buckets verified successfully");
          setIsBucketVerified(true);
          setBucketError(null);
        } else {
          // Try one more time specifically for the documents bucket
          const documentBucketExists = await ensureBucketExists(DOCUMENTS_BUCKET);
          setIsBucketVerified(documentBucketExists);
          
          if (!documentBucketExists) {
            setBucketError(`Storage bucket "${DOCUMENTS_BUCKET}" not found. Please click "Fix Storage" to resolve this issue.`);
          }
        }
      } catch (error) {
        console.error('Error verifying buckets:', error);
        setBucketError(`Error verifying storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    verifyAndFixBuckets();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }
    
    // Verify bucket exists before upload
    if (!isBucketVerified) {
      try {
        const exists = await ensureBucketExists(DOCUMENTS_BUCKET);
        setIsBucketVerified(exists);
        if (!exists) {
          setBucketError(`Storage bucket "${DOCUMENTS_BUCKET}" not found. Please click "Fix Storage" to resolve this issue.`);
          return;
        }
      } catch (error) {
        console.error('Error verifying bucket before upload:', error);
        setBucketError(`Error verifying storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }

    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        setUploadProgress(0);
        toast.info(`Uploading ${file.name}...`);
        
        const result = await upload(file);
        
        if (result.success && result.documentId) {
          toast.success(`${file.name} uploaded successfully!`);
          if (onUploadComplete) {
            onUploadComplete(result);
          }
        } else {
          // Check if error is due to bucket not found
          if (result.error && (result.error.includes('bucket not found') || result.error.includes('not found'))) {
            setBucketError(`Bucket not found. Please click "Fix Storage" to resolve this issue.`);
            setIsBucketVerified(false);
          }
          toast.error(`Failed to upload ${file.name}: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Check if error is due to bucket not found
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('bucket not found') || errorMessage.includes('not found')) {
        setBucketError(`Bucket not found. Please click "Fix Storage" to resolve this issue.`);
        setIsBucketVerified(false);
      }
      
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [clientId, upload, onUploadComplete, isBucketVerified]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading || !isBucketVerified || isFixingBucket || isCheckingConnection,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });
  
  const handleFixStorage = async () => {
    setIsFixingBucket(true);
    try {
      // First try to refresh the connection
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn("Session refresh error during fix:", error);
        } else {
          console.log("Auth session refreshed successfully");
        }
      } catch (refreshErr) {
        console.warn("Failed to refresh session:", refreshErr);
      }
      
      // Now try to fix the bucket
      const fixed = await handleBucketNotFoundError(DOCUMENTS_BUCKET);
      if (fixed) {
        setBucketError(null);
        setIsBucketVerified(true);
        toast.success(`Storage bucket "${DOCUMENTS_BUCKET}" is now available`);
      } else {
        toast.error("Couldn't fix storage issue automatically. Please try again later.");
      }
    } catch (error) {
      console.error('Error fixing storage:', error);
      toast.error(`Failed to fix storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFixingBucket(false);
    }
  };

  const handleRetryConnection = async () => {
    setIsCheckingConnection(true);
    try {
      // Try to refresh the session
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        toast.error(`Failed to reconnect: ${error.message}`);
      } else {
        toast.success("Connection refreshed successfully");
        
        // Verify buckets again
        const allBucketsExist = await ensureAllBucketsExist();
        setIsBucketVerified(allBucketsExist);
        
        if (allBucketsExist) {
          setBucketError(null);
          toast.success("Storage buckets verified successfully");
        } else {
          setBucketError("Storage buckets still not available. Try fixing storage.");
        }
      }
    } catch (error) {
      console.error("Error retrying connection:", error);
      toast.error(`Failed to reconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      {isCheckingConnection && (
        <Alert variant="default" className="bg-blue-50 border border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <AlertDescription>Checking connection to storage...</AlertDescription>
        </Alert>
      )}
      
      {bucketError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{bucketError}</AlertDescription>
          <div className="mt-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFixStorage} 
              disabled={isFixingBucket || isCheckingConnection}
            >
              {isFixingBucket ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Fixing Storage...
                </>
              ) : (
                'Fix Storage'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryConnection}
              disabled={isCheckingConnection}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingConnection ? 'animate-spin' : ''}`} />
              Reconnect
            </Button>
          </div>
        </Alert>
      )}
      
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${(isUploading || !isBucketVerified || isFixingBucket || isCheckingConnection) ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p>Uploading... {uploadProgress > 0 ? `${uploadProgress}%` : ''}</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : isCheckingConnection ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p className="mt-2">Verifying storage connection...</p>
          </div>
        ) : isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <div>
            <p>Drag and drop files here, or click to select files</p>
            <p className="text-sm text-gray-500 mt-2">Supports: PDF, Word, Excel, and Text files</p>
            {!isBucketVerified && (
              <p className="text-xs text-red-500 mt-1">
                Storage not available. Please fix storage issues first.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
