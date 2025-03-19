
import { useState } from "react";
import { DocumentLinks } from "@/components/client/DocumentLinks";
import { DriveLink } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "@/types/activity";

interface DocumentResourcesSectionProps {
  documentLinks: DriveLink[];
  addDriveLinkMutation: any;
  deleteDriveLinkMutation: any;
  uploadDocumentMutation: any;
  clientId: string;
  agentName: string | null | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const DocumentResourcesSection = ({
  documentLinks,
  addDriveLinkMutation,
  deleteDriveLinkMutation,
  uploadDocumentMutation,
  clientId,
  agentName,
  isClientView,
  logClientActivity
}: DocumentResourcesSectionProps) => {
  const restrictedLinks = documentLinks.filter(link => link.access_status === "restricted");
  const hasRestrictedLinks = restrictedLinks.length > 0;

  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number; document_type?: string }) => {
    try {
      if (!clientId) {
        throw new Error("Client ID is required to add a document link");
      }
      
      console.log("Adding document link:", data, "for client:", clientId);
      await addDriveLinkMutation.mutateAsync(data);
      
      if (isClientView) {
        try {
          await logClientActivity(
            "document_link_added", 
            "added a document link", 
            { link: data.link, refresh_rate: data.refresh_rate, document_type: data.document_type }
          );
        } catch (logError) {
          console.error("Error logging document link activity:", logError);
        }
      }
    } catch (error) {
      console.error("Error adding document link:", error);
      throw error;
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      const linkToDelete = documentLinks.find(link => link.id === linkId);
      await deleteDriveLinkMutation.mutateAsync(linkId);
      
      if (isClientView && linkToDelete) {
        try {
          await logClientActivity(
            "document_link_deleted", 
            "removed a document link", 
            { link: linkToDelete.link }
          );
        } catch (logError) {
          console.error("Error logging document link deletion:", logError);
        }
      }
    } catch (error) {
      console.error("Error deleting document link:", error);
      throw error;
    }
  };

  const handleUploadDocument = async (file: File, agentName: string) => {
    try {
      if (!clientId) {
        throw new Error("Client ID is required to upload a document");
      }
      
      console.log("Uploading document for client:", clientId, "agent:", agentName);
      await uploadDocumentMutation.mutateAsync({ file, agentName });
      
      if (isClientView) {
        try {
          await logClientActivity(
            "document_uploaded", 
            "uploaded a document to the knowledge base", 
            { filename: file.name, filesize: file.size, filetype: file.type }
          );
        } catch (logError) {
          console.error("Error logging document upload activity:", logError);
        }
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  };

  return (
    <div className="rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Sources</h3>
      
      {hasRestrictedLinks && (
        <Alert variant="warning" className="mb-4 border-amber-300 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Restricted Access Detected</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mb-2">
              {restrictedLinks.length > 1 
                ? `${restrictedLinks.length} document links have restricted access.` 
                : "One document link has restricted access."} 
              Your AI agent cannot access these files.
            </p>
            <p className="text-sm">
              To fix this: For Google Drive links, open each restricted link, click "Share", and change access to "Anyone with the link".
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      <DocumentLinks
        documentLinks={documentLinks}
        onAdd={handleAddDocumentLink}
        onDelete={handleDeleteDocumentLink}
        onUpload={handleUploadDocument}
        isAddLoading={addDriveLinkMutation.isPending}
        isDeleteLoading={deleteDriveLinkMutation.isPending}
        isUploadLoading={uploadDocumentMutation.isPending}
        clientId={clientId}
        agentName={agentName || undefined}
      />
    </div>
  );
};
