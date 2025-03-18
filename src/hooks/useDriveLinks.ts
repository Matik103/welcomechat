
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DocumentLink, AccessStatus } from "@/types/client";

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["documentLinks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log("Fetching document links for client:", clientId);
      const { data, error } = await supabase
        .from("google_drive_links")
        .select("*")
        .eq("client_id", clientId);
        
      if (error) {
        console.error("Error fetching document links:", error);
        throw error;
      }
      
      console.log("Fetched document links:", data);
      return data as DocumentLink[];
    },
    enabled: !!clientId,
  });

  const extractDocumentId = (link: string): string => {
    console.log("Extracting document ID from link:", link);
    let fileId = '';
    
    try {
      // Google Drive and Google Docs links
      if (link.includes('drive.google.com/drive/folders/')) {
        const folderMatch = link.match(/folders\/([^/?]+)/);
        if (folderMatch && folderMatch[1]) {
          fileId = folderMatch[1];
        }
      } else if (link.includes('docs.google.com/document/d/') || 
                 link.includes('docs.google.com/spreadsheets/d/') ||
                 link.includes('docs.google.com/presentation/d/')) {
        const docsMatch = link.match(/\/d\/([^/]+)/);
        if (docsMatch && docsMatch[1]) {
          fileId = docsMatch[1];
        }
      } else if (link.includes('/file/d/')) {
        fileId = link.split('/file/d/')[1]?.split('/')[0];
      } else if (link.includes('id=')) {
        fileId = new URL(link).searchParams.get('id') || '';
      } else if (link.includes('/d/')) {
        fileId = link.split('/d/')[1]?.split('/')[0];
      }
      
      // If we couldn't extract an ID but it's a valid URL, use the whole URL as ID
      if (!fileId && isValidUrl(link)) {
        fileId = encodeURIComponent(link);
      }
      
      console.log("Extracted document ID:", fileId);
      
      if (!fileId) {
        throw new Error("Invalid document link format - couldn't extract ID");
      }
      
      return fileId;
    } catch (error) {
      console.error("Error extracting document ID:", error);
      throw new Error("Invalid document link format - couldn't extract ID");
    }
  };

  // Helper to check if string is a valid URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Helper to determine if a link is a Google Drive resource
  const isGoogleDriveResource = (documentType: string, link: string): boolean => {
    if (documentType === 'google_drive' || 
        documentType === 'google_doc' || 
        documentType === 'google_sheet') {
      return true;
    }
    
    // Also check the URL itself for Google domains
    return link.includes('drive.google.com') || 
           link.includes('docs.google.com') || 
           link.includes('sheets.google.com') || 
           link.includes('slides.google.com');
  };

  // Simplified check for document access - only for Google Drive resources
  const checkDocumentAccess = async (link: string, documentType: string): Promise<AccessStatus> => {
    try {
      // Skip access check for non-Google resources
      if (!isGoogleDriveResource(documentType, link)) {
        return "public"; // Assume non-Google resources are accessible
      }
      
      // Since we've removed OAuth, we'll just set access status to unknown
      // for Google Drive resources
      return "unknown";
    } catch (error: any) {
      console.error("Document access check error:", error);
      return "unknown";
    }
  };

  const addDocumentLink = async (input: { link: string; refresh_rate: number; document_type?: string }): Promise<DocumentLink> => {
    if (!clientId) {
      console.error("Client ID is missing");
      throw new Error("Client ID is required");
    }
    
    console.log("Adding document link with client ID:", clientId);
    console.log("Input data:", input);
    
    // Set access status based on document type
    const documentType = input.document_type || "unknown";
    let accessStatus: AccessStatus = "public"; // Default for non-Google resources
    
    // Only check access for Google Drive resources
    if (isGoogleDriveResource(documentType, input.link)) {
      accessStatus = "unknown"; // Since we can't check anymore
    }
    
    // Insert the document link with access status
    try {
      const { error: schemaError } = await supabase
        .from("google_drive_links")
        .select("access_status")
        .limit(1);
      
      const baseData: {
        client_id: string;
        link: string;
        refresh_rate: number;
        document_type?: string;
      } = {
        client_id: clientId,
        link: input.link,
        refresh_rate: input.refresh_rate,
        document_type: documentType
      };
      
      let insertData: any;
      
      if (!schemaError) {
        console.log("The access_status column exists, adding it to the insert data");
        insertData = {
          ...baseData,
          access_status: accessStatus
        } as (typeof baseData & { access_status: AccessStatus });
      } else {
        console.log("The access_status column does not exist, using base data only");
        insertData = baseData;
      }
      
      const { data, error } = await supabase
        .from("google_drive_links")
        .insert(insertData)
        .select()
        .single();
      
      console.log("Supabase response:", { data, error });
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to create document link - no data returned");
      }
      
      return data as DocumentLink;
    } catch (insertError) {
      console.error("Error inserting document link:", insertError);
      throw insertError;
    }
  };

  const deleteDriveLink = async (linkId: number): Promise<number> => {
    const { error } = await supabase
      .from("google_drive_links")
      .delete()
      .eq("id", linkId);
    if (error) throw error;
    return linkId;
  };

  // For file upload directly to the AI agent's knowledge base
  const uploadDocumentToKnowledgeBase = async (file: File, agentName: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }

      if (!agentName) {
        throw new Error("Agent name is required");
      }

      // First, upload the file to Supabase storage
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `${clientId}/${safeName}_${timestamp}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('client_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase
        .storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }
      
      // Add file to the AI agent's knowledge base
      const metadata = {
        source: "file_upload",
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        url: urlData.publicUrl
      };
      
      const { error: aiAgentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: agentName,
          content: `File uploaded: ${file.name}`,
          url: urlData.publicUrl,
          interaction_type: "file_upload",
          settings: metadata
        });
      
      if (aiAgentError) {
        console.error("Error adding file to AI agent knowledge base:", aiAgentError);
        throw aiAgentError;
      }
      
      return {
        success: true,
        message: `File ${file.name} has been successfully uploaded and added to the knowledge base.`
      };
      
    } catch (error) {
      console.error("Error in uploadDocumentToKnowledgeBase:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error uploading document"
      };
    }
  };

  const addDriveLinkMutation = useMutation({
    mutationFn: addDocumentLink,
    onSuccess: (data) => {
      console.log("Document link added successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["documentLinks", clientId] });
      toast.success("Document link added successfully");
    },
    onError: (error: Error) => {
      console.error("Document link mutation error:", error);
      toast.error(`Error adding document link: ${error.message}`);
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, agentName }: { file: File; agentName: string }) => 
      uploadDocumentToKnowledgeBase(file, agentName),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      console.error("Document upload error:", error);
      toast.error(`Error uploading document: ${error.message}`);
    }
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: deleteDriveLink,
    onSuccess: (id) => {
      console.log("Document link deleted successfully, ID:", id);
      queryClient.invalidateQueries({ queryKey: ["documentLinks", clientId] });
      toast.success("Document link removed successfully");
    },
    onError: (error: Error) => {
      console.error("Document link deletion error:", error);
      toast.error(`Error removing document link: ${error.message}`);
    }
  });

  return {
    documentLinks: query.data || [],
    refetchDocumentLinks: query.refetch,
    addDriveLinkMutation,
    deleteDriveLinkMutation,
    uploadDocumentMutation,
    isLoading: query.isLoading,
    isError: query.isError
  };
}
