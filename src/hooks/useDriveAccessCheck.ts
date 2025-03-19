
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/types/client";

interface DriveCheckResult {
  accessLevel: AccessStatus;
  fileType: 'file' | 'folder' | 'unknown';
  error?: string;
  fileId?: string;
}

export function useDriveAccessCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<DriveCheckResult | null>(null);

  const extractDriveFileId = (link: string): { fileId: string; isFolder: boolean } => {
    console.log("Extracting file ID from link:", link);
    let fileId = '';
    let isFolder = false;
    
    try {
      if (link.includes('drive.google.com/drive/folders/')) {
        const folderMatch = link.match(/folders\/([^/?]+)/);
        if (folderMatch && folderMatch[1]) {
          fileId = folderMatch[1];
          isFolder = true;
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
      
      console.log("Extracted file ID:", fileId, "Is folder:", isFolder);
      
      if (!fileId) {
        throw new Error("Invalid Google Drive link format - couldn't extract file ID");
      }
      
      return { fileId, isFolder };
    } catch (error) {
      console.error("Error extracting file ID:", error);
      throw new Error("Invalid Google Drive link format");
    }
  };

  // This function validates that the link is a proper Google Drive link and extracts the file ID
  const validateDriveLink = (link: string): { isValid: boolean; fileId?: string; isFolder?: boolean; error?: string } => {
    try {
      // Basic URL validation
      new URL(link);
      
      // Check if it's a Google Drive link
      if (!link.includes('drive.google.com') && !link.includes('docs.google.com')) {
        return { 
          isValid: false, 
          error: "URL is not a valid Google Drive link" 
        };
      }
      
      // Extract file ID and check if it's a folder
      const { fileId, isFolder } = extractDriveFileId(link);
      return {
        isValid: true,
        fileId,
        isFolder
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid URL format"
      };
    }
  };

  const checkDriveAccess = async (link: string): Promise<DriveCheckResult> => {
    setIsChecking(true);
    
    try {
      console.log("Validating Drive link:", link);
      const validation = validateDriveLink(link);
      
      if (!validation.isValid) {
        const result = {
          accessLevel: "unknown" as AccessStatus,
          fileType: "unknown" as const,
          error: validation.error
        };
        setLastResult(result);
        return result;
      }
      
      // For now, since we don't have OAuth, we can't really check access
      // But we could re-implement this in the future
      const result = {
        accessLevel: "unknown" as AccessStatus,
        fileType: validation.isFolder ? "folder" as const : "file" as const,
        fileId: validation.fileId,
        error: "Google Drive access checking requires authentication which is not currently set up"
      };
      
      setLastResult(result);
      return result;
    } catch (error) {
      console.error("Error in drive access check:", error);
      const result = {
        accessLevel: "unknown" as AccessStatus,
        fileType: "unknown" as const,
        error: error instanceof Error ? error.message : "Unknown error"
      };
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkDriveAccess,
    validateDriveLink,
    isChecking,
    lastResult
  };
}
