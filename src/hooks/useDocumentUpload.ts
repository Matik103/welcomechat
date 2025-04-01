
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DOCUMENTS_BUCKET } from '@/utils/supabaseStorage';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  error?: string;
  documentId?: number;
}

// Improved function to get the effective client ID with better error handling
const getEffectiveClientId = async (clientId: string) => {
  try {
    console.log("Looking up client in ai_agents table with ID:", clientId);
    
    // Try finding the client by ID first (direct match)
    const { data: directMatch, error: directError } = await supabase
      .from("ai_agents")
      .select("id, client_id")
      .eq("id", clientId)
      .eq("interaction_type", "config")
      .single();
      
    if (!directError && directMatch) {
      console.log("Found client by direct ID match:", directMatch.id);
      return directMatch.id;
    }
    
    // If that fails, try by client_id field
    const { data: clientIdMatch, error: clientIdError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("client_id", clientId)
      .eq("interaction_type", "config")
      .single();
      
    if (!clientIdError && clientIdMatch) {
      console.log("Found client by client_id match:", clientIdMatch.id);
      return clientIdMatch.id;
    }
    
    // Try one more query with less restrictions
    const { data: fallbackMatch, error: fallbackError } = await supabase
      .from("ai_agents")
      .select("id, client_id")
      .or(`id.eq.${clientId},client_id.eq.${clientId}`)
      .limit(1);
    
    if (!fallbackError && fallbackMatch && fallbackMatch.length > 0) {
      console.log("Found client using fallback query:", fallbackMatch[0].id);
      return fallbackMatch[0].id;
    }

    // Last resort - just try to find any record with this ID
    const { data: lastResort, error: lastResortError } = await supabase
      .from("ai_agents")
      .select("id")
      .filter('id', 'ilike', `%${clientId}%`)
      .limit(1);
      
    if (!lastResortError && lastResort && lastResort.length > 0) {
      console.log("Found client using partial ID match:", lastResort[0].id);
      return lastResort[0].id;
    }
    
    console.error("All attempts to find client failed for ID:", clientId);
    throw new Error(`Could not find client record with ID: ${clientId}`);
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
      // Get the effective client ID with improved error handling
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

      // Create document link record (using service role if available to bypass RLS)
      // If we're getting RLS errors, we need the service role or updated policies
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
      
      // Try to add metadata if agent name is provided
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
      toast.success('Document uploaded successfully');
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
