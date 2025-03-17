import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { DriveLink, AccessStatus } from "@/types/client";
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useDriveLinks(clientId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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

  // Simplified checkDriveLinkAccess that doesn't use Google OAuth
  const checkDriveLinkAccess = async (link: string): Promise<AccessStatus> => {
    try {
      // Since we've removed OAuth, we'll just set access status to unknown
      return "unknown";
    } catch (error: any) {
      console.error("Drive access check error:", error);
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
    
    // Set default access status to unknown since we can't check anymore
    const accessStatus: AccessStatus = "unknown";
    
    // Insert the drive link with access status
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
      sonnerToast.success("Drive link added successfully");
    },
    onError: (error: Error) => {
      console.error("Drive link mutation error:", error);
      sonnerToast.error(`Error adding drive link: ${error.message}`);
    }
  });

  const deleteDriveLinkMutation = useMutation({
    mutationFn: deleteDriveLink,
    onSuccess: (id) => {
      console.log("Drive link deleted successfully, ID:", id);
      queryClient.invalidateQueries({ queryKey: ["driveLinks", clientId] });
      sonnerToast.success("Drive link removed successfully");
    },
    onError: (error: Error) => {
      console.error("Drive link deletion error:", error);
      sonnerToast.error(`Error removing drive link: ${error.message}`);
    }
  });

  const [links, setLinks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('google_drive_links')
        .select('link')
        .eq('client_id', clientId);

      if (error) throw error;
      setLinks(data.map(item => item.link));
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error fetching links",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLink = async (link: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate URL format
      new URL(link);

      // Call the validate-urls function
      const { data: validationResult, error: validationError } = await supabase.functions.invoke('validate-urls', {
        body: { url: link, type: 'drive' }
      });

      if (validationError) throw validationError;

      if (!validationResult.isAccessible) {
        // Show warning but still allow adding the link
        toast({
          title: "Google Drive Accessibility Warning",
          description: `The Google Drive link might have accessibility issues: ${validationResult.error || 'Unknown error'}
            Please ensure the file or folder is shared with the correct permissions:
            1. Right-click the file/folder in Google Drive
            2. Click "Share"
            3. Click "Change to anyone with the link"
            4. Set access to "Viewer" or "Commenter"
            5. Click "Done"`,
          variant: "default"
        });
      }

      const { error: insertError } = await supabase
        .from('google_drive_links')
        .insert([{ client_id: clientId, link }]);

      if (insertError) throw insertError;

      setLinks([...links, link]);
      toast({
        title: "Link Added",
        description: "The Google Drive link has been added successfully.",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error adding link",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLink = async (link: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('google_drive_links')
        .delete()
        .eq('client_id', clientId)
        .eq('link', link);

      if (error) throw error;

      setLinks(links.filter(l => l !== link));
      toast({
        title: "Link Deleted",
        description: "The Google Drive link has been removed successfully.",
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error deleting link",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    driveLinks: query.data || [],
    refetchDriveLinks: query.refetch,
    addDriveLinkMutation,
    deleteDriveLinkMutation,
    queryLoading: query.isLoading,
    isError: query.isError,
    links,
    isLoading,
    error,
    fetchLinks,
    addLink,
    deleteLink
  };
}
