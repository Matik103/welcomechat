
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { DocumentUpload } from "@/components/client/DocumentUpload";
import { createClientActivity } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";

export interface DocumentsTabProps {
  clientId: string;
  onSuccess?: () => void;
}

export const DocumentsTab = ({ clientId, onSuccess }: DocumentsTabProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
            file_name: result.fileName
          }
        );
      } catch (activityError) {
        console.error("Error logging activity:", activityError);
      }
      
      setIsUploading(false);
      if (onSuccess) onSuccess();
    } else {
      toast({
        title: "Upload failed",
        description: `Failed to upload document: ${result.error || "Unknown error"}`,
        variant: "destructive",
      });
      setIsUploading(false);
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
