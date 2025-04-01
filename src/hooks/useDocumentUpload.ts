
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { v4 as uuidv4 } from 'uuid';
import { LlamaCloudService } from '@/services/LlamaCloudService';

interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: number;
}

const getEffectiveClientId = async (clientId: string) => {
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("interaction_type", "config")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .single();
      
    if (clientError) {
      console.error("Error finding client:", clientError);
      throw new Error("Could not find client record");
    }
    
    if (!clientData) {
      throw new Error("Client not found");
    }
    
    return clientData.id;
  } catch (error) {
    console.error("Error getting effective client ID:", error);
    throw error;
  }
};

export function useDocumentUpload(clientId: string) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocument = async (file: File, agentName?: string): Promise<UploadResult> => {
    if (!clientId) {
      toast.error('Client ID is required');
      return { success: false, error: 'Client ID is required' };
    }

    setIsUploading(true);
    console.log("Starting document upload for client:", clientId, "agent:", agentName || "default");

    try {
      // Get the effective client ID
      const actualClientId = await getEffectiveClientId(clientId);
      console.log("Found client record with ID:", actualClientId);

      // Create a unique file path with a clean filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const uniqueFileName = `${uuidv4()}-${cleanFileName}`;
      const filePath = `${actualClientId}/${uniqueFileName}`;
      
      console.log("Uploading document to path:", filePath);

      // Ensure the bucket exists
      try {
        await ensureDocumentBucketExists();
      } catch (bucketError) {
        console.error("Error ensuring bucket exists:", bucketError);
        // Continue anyway, the bucket might already exist
      }

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // Ensure proper content type is set
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get document URL');
      }

      // Determine document type from file extension
      let documentType = 'document';
      if (fileExtension === 'pdf') documentType = 'pdf';
      else if (['doc', 'docx'].includes(fileExtension)) documentType = 'word';
      else if (['xls', 'xlsx'].includes(fileExtension)) documentType = 'excel';
      else if (['ppt', 'pptx'].includes(fileExtension)) documentType = 'powerpoint';

      // Create document link record
      const documentLinkData: any = {
        client_id: actualClientId,
        link: urlData.publicUrl,
        document_type: documentType,
        refresh_rate: 30,
        access_status: 'accessible',
        file_name: cleanFileName,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath
      };
      
      // Add metadata if agent name is provided
      if (agentName) {
        documentLinkData.metadata = {
          agent_name: agentName,
          source: 'agent_config'
        };
      }

      // Insert the document link
      const { data: documentLink, error: linkError } = await supabase
        .from('document_links')
        .insert(documentLinkData)
        .select()
        .single();

      if (linkError) {
        // If link creation fails, try to delete the uploaded file
        await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .remove([filePath]);
          
        console.error('Error creating document link:', linkError);
        throw new Error(`Error creating document link: ${linkError.message}`);
      }

      console.log("Document link record created:", documentLink);
      
      // Now, send the document to LlamaParse for processing - ENSURE THIS IS ALWAYS CALLED
      try {
        const effectiveAgentName = agentName || "AI Assistant";
        
        console.log("Triggering LlamaParse document processing for:", urlData.publicUrl);
        
        const parseResult = await LlamaCloudService.parseDocument(
          urlData.publicUrl,
          documentType,
          actualClientId,
          effectiveAgentName
        );
        
        if (parseResult.success) {
          console.log("Document successfully sent to LlamaParse for processing:", parseResult.jobId);
          toast.success('Document uploaded and processing started');
        } else {
          console.warn("Document uploaded but LlamaParse processing failed:", parseResult.error);
          toast.warning("Document uploaded, but text extraction encountered an issue. We'll try again automatically.");
          
          // Log the error for debugging
          console.error("LlamaParse error details:", parseResult.error);
        }
      } catch (parseError) {
        console.error("Error sending document to LlamaParse:", parseError);
        toast.warning("Document uploaded, but text extraction encountered an issue. We'll retry automatically.");
      }
      
      return {
        success: true,
        documentId: documentLink.id
      };

    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
        throw createError;
      }
    }
  };

  return {
    uploadDocument,
    isUploading
  };
}
