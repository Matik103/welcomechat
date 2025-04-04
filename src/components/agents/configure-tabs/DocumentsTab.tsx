
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { DocumentUpload } from "@/components/client/DocumentUpload";
import { uploadDocument } from "@/services/documentService";
import { createClientActivity } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";

export interface DocumentsTabProps {
  clientId: string;
  onSuccess?: () => void;
}

export const DocumentsTab = ({ clientId, onSuccess }: DocumentsTabProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSuccess = useCallback(() => {
    toast({
      title: "Document uploaded",
      description: "Document was successfully uploaded and is being processed.",
    });
    setFile(null);
    setIsUploading(false);
    if (onSuccess) onSuccess();
  }, [toast, onSuccess]);

  const handleUploadError = useCallback(
    (error: Error) => {
      console.error("Document upload error:", error);
      toast({
        title: "Upload failed",
        description: `Failed to upload document: ${error.message}`,
        variant: "destructive",
      });
      setIsUploading(false);
    },
    [toast]
  );

  const handleUploadDocument = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      // Upload document
      const result = await uploadDocument(clientId, file, {});
      
      // Log activity
      await createClientActivity(
        clientId,
        undefined,
        ActivityType.DOCUMENT_UPLOADED,
        `Document uploaded: ${file.name}`,
        {
          document_name: file.name,
          document_id: result.documentId,
          client_id: clientId,
        }
      );

      handleUploadSuccess();
    } catch (error) {
      handleUploadError(error as Error);
    }
  };

  const handleDocumentUploadComplete = async (result: any) => {
    if (result.success) {
      toast({
        title: "Document uploaded",
        description: "Document was successfully uploaded and is being processed.",
      });
      
      try {
        // Log activity
        await createClientActivity(
          clientId,
          undefined,
          ActivityType.DOCUMENT_UPLOADED,
          `Document uploaded: ${result.fileName || "Unknown"}`,
          {
            document_id: result.documentId,
            client_id: clientId,
          }
        );
      } catch (activityError) {
        console.error("Error logging activity:", activityError);
      }
      
      if (onSuccess) onSuccess();
    } else {
      toast({
        title: "Upload failed",
        description: `Failed to upload document: ${result.error || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Document Knowledge Base</h3>
        <p className="text-sm text-muted-foreground">
          Upload documents to train your AI assistant with specific knowledge.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Document</TabsTrigger>
          <TabsTrigger value="website">Website Content</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 py-4">
          <DocumentUpload 
            clientId={clientId}
            onUploadComplete={handleDocumentUploadComplete}
          />
        </TabsContent>

        <TabsContent value="website" className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Train your assistant with content from your website.
          </p>
          {/* Website URL scraping functionality would go here */}
          <p className="text-xs text-muted-foreground">
            Coming soon: Add website URLs to train your assistant.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
