
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DocumentUpload } from "@/components/client/DocumentUpload";
import { createClientActivity } from "@/services/clientActivityService";
import { ActivityType } from "@/types/activity";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export interface DocumentsTabProps {
  clientId: string;
  onSuccess?: () => void;
}

export const DocumentsTab = ({ clientId, onSuccess }: DocumentsTabProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleDocumentUploadComplete = async (result: any) => {
    if (result.success) {
      toast.success("Document uploaded successfully", {
        description: "Document was successfully uploaded and processed."
      });
      
      try {
        // Log activity
        await createClientActivity(
          clientId,
          undefined,
          ActivityType.DOCUMENT_ADDED,
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
      toast.error("Upload failed", {
        description: `Failed to upload document: ${result.error || "Unknown error"}`
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

      <Alert variant="info" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          Documents will be processed and made available to your AI assistant immediately after upload.
        </AlertDescription>
      </Alert>

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
