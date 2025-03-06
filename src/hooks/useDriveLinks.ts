
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DriveLink, AccessStatus } from "@/types/client";

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["driveLinks", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log("Fetching drive links for client:", clientId);
      const { data, error } = await supabase
        .from("google_drive_links")
        .select("*")
        .eq("client_id", clientId);
        
      if (error) {
        console.error("Error fetching drive links:", error);
        throw error;
      }
      
      console.log("Fetched drive links:", data);
      return data as DriveLink[];
    },
    enabled: !!clientId,
  });

  const extractDriveFileId = (link: string): string => {
    console.log("Extracting file ID from link:", link);
    let fileId = '';
    
    try {
      // Handle Google Drive folder URLs
      if (link.includes('drive.google.com/drive/folders/')) {
        const folderMatch = link.match(/folders\/([^/?]+)/);
        if (folderMatch && folderMatch[1]) {
          fileId = folderMatch[1];
        }
      }
      // Handle Google Docs, Sheets, Slides URLs
      else if (link.includes('docs.google.com/document/d/') || 
               link.includes('docs.google.com/spreadsheets/d/') ||
               link.includes('docs.google.com/presentation/d/')) {
        const docsMatch = link.match(/\/d\/([^/]+)/);
        if (docsMatch && docsMatch[1]) {
          fileId = docsMatch[1];
        }
      }
      // Handle Google Drive file URLs
      else if (link.includes('/file/d/')) {
        fileId = link.split('/file/d/')[1]?.split('/')[0];
      } 
      // Handle URLs with id parameter
      else if (link.includes('id=')) {
        fileId = new URL(link).searchParams.get('id') || '';
      } 
      // Handle shortened /d/ URLs
      else if (link.includes('/d/')) {
        fileId = link.split('/d/')[1]?.split('/')[0];
      }
      
      console.log("Extracted file ID:", fileId);
      
      if (!fileId) {
        throw new Error("Invalid Google Drive link format - couldn't extract file ID");
      }
      
      return fileId;
    } catch (error) {
      console.error("Error extracting file ID:", error);
      throw new Error("Invalid Google Drive link format - couldn't extract file ID");
    }
  };

  const checkDriveLinkAccess = async (link: string): Promise<AccessStatus> => {
    try {
      // Extract file ID from Google Drive link
      const fileId = extractDriveFileId(link);
      console.log("Extracted file ID:", fileId);
      
      // Setup the headers to detect redirects and access issues
      const headers = new Headers();
      headers.append('Accept', 'text/html,application/xhtml+xml');
      
      // Check if the file is publicly accessible
      // For Google Drive files and folders
      let accessCheckUrl: string;
      
      if (link.includes('docs.google.com')) {
        // For Google Docs, Sheets, etc.
        accessCheckUrl = `https://docs.google.com/uc?id=${fileId}&export=download`;
      } else {
        // For regular Drive files and folders
        accessCheckUrl = `https://drive.google.com/uc?id=${fileId}`;
      }
      
      console.log("Checking access with URL:", accessCheckUrl);
      
      // Attempt to access the file - this won't actually download it
      // but will check if it's accessible without authentication
      const response = await fetch(accessCheckUrl, {
        method: 'HEAD',
        headers: headers,
        redirect: 'manual', // Don't automatically follow redirects
      });

      console.log("Drive link access check response status:", response.status);
      
      // Check response status and patterns that indicate restricted access
      if (response.status === 200) {
        // Check if there's any content-disposition header
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          return "public"; // If we get content disposition, it's downloadable and public
        }
        return "public"; // 200 OK generally means accessible
      } else if (response.status === 302 || response.status === 303) {
        // Check where the redirect is going
        const location = response.headers.get('location');
        console.log("Redirect location:", location);
        
        if (location && (
            location.includes('accounts.google.com/signin') || 
            location.includes('accounts.google.com/ServiceLogin') ||
            location.includes('accounts.google.com/v3/signin')
        )) {
          return "restricted"; // Redirects to login page indicate restricted access
        }
        
        return "unknown"; // Other redirects might be ambiguous
      } else if (response.status === 401 || response.status === 403) {
        return "restricted"; // Explicit authorization errors
      }
      
      // Check if there's already data for this URL in the AI agent table
      const { data: existingData } = await supabase
        .from('ai_agent')
        .select('id')
        .eq('metadata->>client_id', clientId)
        .eq('metadata->>url', link)
        .maybeSingle();
      
      if (existingData) {
        // Delete existing data to avoid duplicates
        await supabase
          .from('ai_agent')
          .delete()
          .eq('id', existingData.id);
      }

      // Default to unknown if we can't determine for sure
      return "unknown";
    } catch (error: any) {
      console.error("Drive access check error:", error);
      
      // Log error to database
      if (clientId) {
        await supabase.from("error_logs").insert({
          client_id: clientId,
          error_type: "drive_link_access",
          message: error.message,
          status: "error"
        });
      }
      
      // Immediately notify the user of the error
      toast.error(`Google Drive access error: ${error.message}`);
      
      return "unknown";
    }
  };

  const addDriveLink = async (input: { link: string; refresh_rate: number }): Promise<DriveLink> => {
    if (!clientId) {
      console.error("Client ID is missing");
      throw new Error("Client ID is required");
    }
    
    console.log("Adding drive link with client ID:", clientId);
    console.log("Input data:", input);
    
    // Validate Google Drive link and check access status
    let accessStatus: AccessStatus;
    try {
      accessStatus = await checkDriveLinkAccess(input.link);
      console.log("Drive link access status:", accessStatus);
      
      if (accessStatus === "restricted") {
        // Show a warning toast but don't block the addition
        toast.warning("This Google Drive link has restricted access. The AI agent may not be able to access all content.");
      }
    } catch (error) {
      console.error("Drive link access check failed:", error);
      accessStatus = "unknown";
      // Still proceed with adding the link
    }
    
    // If validation passes, add the link to the database
    try {
      const { data, error } = await supabase
        .from("google_drive_links")
        .insert({
          client_id: clientId, 
          link: input.link, 
          refresh_rate: input.refresh_rate,
          access_status: accessStatus
        })
        .select()
        .single();
      
      console.log("Supabase response:", { data, error });
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("Failed to create drive link - no data returned");
      }
      
      return data as DriveLink;
    } catch (insertError) {
      console.error("Error inserting drive link:", insertError);
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

  const addDriveLinkMutation = useMutation({
    mutationFn: addDriveLink,
    onSuccess: (data) => {
      console.log("Drive link added successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      
      // Show specific toast based on access status
      if (data.access_status === "public") {
        toast.success("Drive link added successfully - Public access detected");
      } else if (data.access_status === "restricted") {
        toast.warning("Drive link added with restricted access - AI may not be able to access all content");
      } else {
        toast.success("Drive link added successfully");
      }
    },
    onError: (error: Error) => {
      console.error("Drive link mutation error:", error);
      toast.error(`Error adding drive link: ${error.message}`);
    }
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: deleteDriveLink,
    onSuccess: (id) => {
      console.log("Drive link deleted successfully, ID:", id);
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      toast.success("Drive link removed successfully");
    },
    onError: (error: Error) => {
      console.error("Drive link deletion error:", error);
      toast.error(`Error removing drive link: ${error.message}`);
    }
  });

  return {
    driveLinks: query.data || [],
    refetchDriveLinks: query.refetch,
    addDriveLinkMutation,
    deleteDriveLinkMutation,
    isLoading: query.isLoading,
    isError: query.isError
  };
}
