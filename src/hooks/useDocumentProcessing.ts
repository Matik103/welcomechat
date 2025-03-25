
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

export function useDocumentProcessing(clientId: string, agentName: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        
        // Create a unique filename to prevent collisions
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}-${file.name}`;
        
        // Get authenticated user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          throw new Error('Authentication required for uploads');
        }
        
        // Create folder path with user ID as the folder name to organize uploads
        const folderPath = `${userData.user.id}/${fileName}`;
        
        // Upload the file to the storage bucket
        const { data, error } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .upload(folderPath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });
        
        // Set progress to 100% when complete (since we can't track real-time progress)
        setUploadProgress(100);
        
        if (error) {
          throw error;
        }
        
        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from(DOCUMENTS_BUCKET)
          .getPublicUrl(data.path);
        
        if (!urlData || !urlData.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file');
        }
        
        // Log the upload activity
        await supabase.from('client_activities').insert({
          client_id: clientId,
          activity_type: 'document_uploaded',
          description: `Document uploaded: ${file.name}`,
          metadata: {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            path: data.path,
            bucket: DOCUMENTS_BUCKET,
            user_id: userData.user.id
          }
        });
        
        // Process the document through LlamaParse
        const { data: processData, error: processError } = await supabase.functions.invoke(
          'process-document',
          {
            body: {
              documentUrl: urlData.publicUrl,
              documentType: file.type,
              clientId: clientId,
              agentName: agentName
            }
          }
        );
        
        if (processError) {
          console.error('Error processing document:', processError);
          toast.error('Document uploaded but processing failed. Please try again later.');
        }
        
        return {
          path: data.path,
          url: urlData.publicUrl,
          jobId: processData?.jobId
        };
      } catch (error) {
        console.error('Error in handleDocumentUpload:', error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    }
  });

  const handleDocumentUpload = async (file: File) => {
    try {
      // Check authentication status before attempting upload
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        toast.error('You must be logged in to upload documents');
        return null;
      }
      
      const result = await uploadMutation.mutateAsync(file);
      
      toast.success('Document uploaded successfully! Processing started.');
      
      return result;
    } catch (error: any) {
      console.error('Document upload failed:', error);
      toast.error(`Failed to upload document: ${error.message}`);
      throw error;
    }
  };

  return {
    handleDocumentUpload,
    isUploading,
    uploadProgress
  };
}
