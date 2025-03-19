
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WebsiteUrl } from "@/types/client";
import { WebsiteUrlsList } from "./WebsiteUrlsList";
import { WebsiteUrlForm } from "./WebsiteUrlForm";
import { useDocumentProcessor } from "@/hooks/useDocumentProcessor";
import { toast } from "sonner";

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: { url: string; refresh_rate: number }) => Promise<void>;
  onDelete: (id: number) => void;
  isAddLoading: boolean;
  isDeleteLoading: boolean;
  clientId?: string;
  agentName?: string;
}

export const WebsiteUrls = ({
  urls,
  onAdd,
  onDelete,
  isAddLoading,
  isDeleteLoading,
  clientId,
  agentName,
}: WebsiteUrlsProps) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { processDocument, isProcessing } = useDocumentProcessor();

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Error deleting URL:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async (data: { url: string; refresh_rate: number }) => {
    try {
      await onAdd(data);
      
      if (clientId && agentName) {
        try {
          const documentId = `website_${Date.now()}`;
          
          toast.info("Processing website content...");
          
          await processDocument({
            documentUrl: data.url,
            documentType: "website_url",
            clientId,
            agentName,
            documentId
          });
        } catch (processingError) {
          console.error("Error processing website:", processingError);
          toast.error(`Website URL added but content processing failed: ${processingError instanceof Error ? processingError.message : "Unknown error"}`);
        }
      }
      
      setShowNewForm(false);
    } catch (error) {
      console.error("Error in handleAdd:", error);
      throw error; // Let the form handle the error display
    }
  };

  return (
    <div className="space-y-4">
      <WebsiteUrlsList
        urls={urls}
        onDelete={handleDelete}
        isDeleteLoading={isDeleteLoading}
        deletingId={deletingId}
      />

      {!showNewForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewForm(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Website URL
        </Button>
      ) : (
        <WebsiteUrlForm
          onAdd={handleAdd}
          onCancel={() => setShowNewForm(false)}
          isAddLoading={isAddLoading}
          clientId={clientId}
          agentName={agentName}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};
