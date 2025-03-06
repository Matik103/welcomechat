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
      const fileId = extractDriveFileId(link);
      console.log("Extracted file ID:", fileId);
      
      const headers = new Headers();
      headers.append('Accept', 'text/html,application/xhtml+xml');
      
      let accessCheckUrl: string;
      
      if (link.includes('docs.google.com')) {
        accessCheckUrl = `https://docs.google.com/uc?id=${fileId}&export=download`;
      } else {
        accessCheckUrl = `https://drive.google.com/uc?id=${fileId}`;
      }
      
      console.log("Checking access with URL:", accessCheckUrl);
      
      let accessStatus: AccessStatus = "unknown";
      
      try {
        const response = await fetch(accessCheckUrl, {
          method: 'HEAD',
          headers: headers,
          redirect: 'manual',
          cache: 'no-cache',
        });

        console.log("Drive link access check response status:", response.status);
        
        if (response.status === 200) {
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
            accessStatus = "public";
          } else {
            accessStatus = "public";
          }
        } else if (response.status === 302 || response.status === 303) {
          const location = response.headers.get('location');
          console.log("Redirect location:", location);
          
          if (location && (
              location.includes('accounts.google.com/signin') || 
              location.includes('accounts.google.com/ServiceLogin') ||
              location.includes('accounts.google.com/v3/signin') ||
              location.includes('accounts.google.com/AccountChooser')
          )) {
            accessStatus = "restricted";
          } else if (location && location.includes('drive.google.com/file/d/')) {
            try {
              const secondResponse = await fetch(location, {
                method: 'HEAD',
                headers: headers,
                redirect: 'manual',
              });
              
              if (secondResponse.status === 200) {
                accessStatus = "public";
              } else if (secondResponse.status === 302 || secondResponse.status === 303) {
                const secondLocation = secondResponse.headers.get('location');
                if (secondLocation && secondLocation.includes('accounts.google.com')) {
                  accessStatus = "restricted";
                }
              }
            } catch (secondFetchError) {
              console.log("Second fetch error:", secondFetchError);
            }
          }
        } else if (response.status === 401 || response.status === 403) {
          accessStatus = "restricted";
        }
      } catch (fetchError) {
        console.log("Fetch error during access check:", fetchError);
        accessStatus = "unknown";
      }
      
      if (link.includes('drive.google.com/drive/folders/') && accessStatus === "unknown") {
        try {
          const folderResponse = await fetch(link, {
            method: 'HEAD',
            headers: headers,
            redirect: 'manual',
          });
          
          if (folderResponse.status === 200) {
            accessStatus = "public";
          } else if (folderResponse.status === 302 || folderResponse.status === 303) {
            const location = folderResponse.headers.get('location');
            if (location && location.includes('accounts.google.com')) {
              accessStatus = "restricted";
            }
          }
        } catch (folderFetchError) {
          console.log("Folder fetch error:", folderFetchError);
        }
      }
      
      const { data: existingData } = await supabase
        .from('ai_agent')
        .select('id')
        .eq('metadata->>client_id', clientId)
        .eq('metadata->>url', link)
        .maybeSingle();
      
      if (existingData) {
        await supabase
          .from('ai_agent')
          .delete()
          .eq('id', existingData.id);
      }

      console.log("Final access status determined:", accessStatus);
      return accessStatus;
    } catch (error: any) {
      console.error("Drive access check error:", error);
      
      if (clientId) {
        await supabase.from("error_logs").insert({
          client_id: clientId,
          error_type: "drive_link_access",
          message: error.message,
          status: "error"
        });
      }
      
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
    
    const { data: existingLinks } = await supabase
      .from("google_drive_links")
      .select("*")
      .eq("client_id", clientId)
      .eq("link", input.link);
      
    if (existingLinks && existingLinks.length > 0) {
      console.error("Drive link already exists for this client");
      throw new Error("This Google Drive link has already been added");
    }
    
    let accessStatus: AccessStatus;
    try {
      accessStatus = await checkDriveLinkAccess(input.link);
      console.log("Drive link access status:", accessStatus);
      
      if (accessStatus === "restricted") {
        toast.warning("This Google Drive link has restricted access. The AI agent will not be able to access this content.", {
          duration: 5000,
          description: "Please change sharing settings to 'Anyone with the link' in Google Drive."
        });
      }
    } catch (error) {
      console.error("Drive link access check failed:", error);
      accessStatus = "unknown";
    }
    
    try {
      const { error: schemaError } = await supabase
        .from("google_drive_links")
        .select("access_status")
        .limit(1);
      
      const baseData: {
        client_id: string;
        link: string;
        refresh_rate: number;
      } = {
        client_id: clientId,
        link: input.link,
        refresh_rate: input.refresh_rate,
      };
      
      let insertData: any;
      
      if (!schemaError) {
        insertData = {
          ...baseData,
          access_status: accessStatus
        } as (typeof baseData & { access_status: AccessStatus });
      } else {
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
