
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = async (file: File) => {
    if (!clientId) {
      toast.error('Client ID is required for uploading documents');
      return Promise.reject(new Error('Client ID is required'));
    }

    setIsUploading(true);
    console.log("Starting document upload for client:", clientId);
    
    try {
      // First, find the correct client record
      const { data: clientRecord, error: clientError } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("interaction_type", "config")
        .or(`id.eq.${clientId},client_id.eq.${clientId}`)
        .single();
        
      if (clientError) {
        console.error("Error finding client:", clientError);
        throw new Error("Could not find client record");
      }
      
      if (!clientRecord) {
        throw new Error("Client record not found");
      }
      
      const actualClientId = clientRecord.id;
      console.log("Found client record with ID:", actualClientId);

      // Create a unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^\w\s.-]/g, ''); // Remove special characters
      const filePath = `${actualClientId}/${timestamp}_${sanitizedFileName}`;
      
      console.log("Uploading document to path:", filePath);

      // Ensure the bucket exists
      try {
        await ensureDocumentBucketExists();
      } catch (bucketError) {
        console.error("Error ensuring bucket exists:", bucketError);
        // Continue anyway, the bucket might already exist
      }

      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading document:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Document uploaded successfully:", uploadData);

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for document');
      }

      const publicUrl = urlData.publicUrl;
      console.log("Document public URL:", publicUrl);

      // Determine document type from file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      let documentType = 'document';
      
      if (fileExtension === 'pdf') documentType = 'pdf';
      else if (['doc', 'docx'].includes(fileExtension)) documentType = 'word';
      else if (['xls', 'xlsx'].includes(fileExtension)) documentType = 'excel';
      else if (['ppt', 'pptx'].includes(fileExtension)) documentType = 'powerpoint';
      
      // Add document link to document_links table
      const { data: linkData, error: linkError } = await supabase
        .from('document_links')
        .insert({
          client_id: actualClientId,
          link: publicUrl,
          document_type: documentType,
          refresh_rate: 30, // Default 30 days
          access_status: 'accessible',
          storage_path: filePath
        })
        .select()
        .single();

      if (linkError) {
        console.error("Error creating document link record:", linkError);
        // Try to clean up the uploaded file
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
        throw linkError;
      }

      console.log("Document link record created:", linkData);
      return linkData;
      
    } catch (error) {
      console.error("Document upload failed:", error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to ensure the documents bucket exists
  const ensureDocumentBucketExists = async () => {
    // First check if the bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      throw bucketsError;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log(`Creating ${DOCUMENTS_BUCKET} bucket...`);
      const { error: createError } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      });
      
      if (createError) {
        console.error(`Error creating ${DOCUMENTS_BUCKET} bucket:`, createError);
        throw createError;
      }
    }
  };

  return {
    uploadDocument,
    isUploading
  };
}
