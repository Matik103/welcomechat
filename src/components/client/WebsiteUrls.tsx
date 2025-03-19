
import { useState } from "react";
import { WebsiteUrlForm } from "@/components/client/website-urls/WebsiteUrlForm";
import { WebsiteUrlsList } from "@/components/client/website-urls/WebsiteUrlsList";
import { WebsiteUrl } from "@/types/client";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { useDocumentProcessor } from "@/hooks/useDocumentProcessor";
import { toast } from "sonner";

interface WebsiteUrlsProps {
  clientId: string;
  agentName?: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: any, description: string, metadata?: any) => Promise<void>;
}

export const WebsiteUrls = ({ 
  clientId, 
  agentName, 
  isClientView = false,
  logClientActivity
}: WebsiteUrlsProps) => {
  const { 
    websiteUrls, 
    addWebsiteUrlMutation, 
    deleteWebsiteUrlMutation, 
    isLoading 
  } = useWebsiteUrls(clientId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const { processDocument, isProcessing } = useDocumentProcessor();
  const [processingUrlId, setProcessingUrlId] = useState<number | null>(null);

  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      const newUrl = await addWebsiteUrlMutation.mutateAsync(data);
      setShowAddForm(false);
      
      // Process the website content
      if (agentName && newUrl) {
        processDocument({
          documentUrl: data.url,
          documentType: "website_url",
          clientId: clientId,
          agentName: agentName,
          documentId: newUrl.id.toString()
        });
      }
      
      // Log activity
      await logClientActivity(
        "website_url_added",
        `Added website URL: ${data.url}`,
        { url: data.url, refresh_rate: data.refresh_rate }
      );
      
      toast.success("Website URL added successfully");
    } catch (error) {
      console.error("Error adding website URL:", error);
      toast.error("Failed to add website URL");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const deletedUrl = websiteUrls.find(url => url.id === id);
      await deleteWebsiteUrlMutation.mutateAsync(id);
      
      if (deletedUrl) {
        await logClientActivity(
          "website_url_deleted",
          `Deleted website URL: ${deletedUrl.url}`,
          { url: deletedUrl.url }
        );
      }
      
      toast.success("Website URL deleted successfully");
    } catch (error) {
      console.error("Error deleting website URL:", error);
      toast.error("Failed to delete website URL");
    }
  };

  const handleProcessUrl = async (url: WebsiteUrl) => {
    if (!agentName) {
      toast.error("Cannot process URL: Agent name is missing");
      return;
    }
    
    setProcessingUrlId(url.id);
    
    try {
      await processDocument({
        documentUrl: url.url,
        documentType: "website_url",
        clientId: clientId,
        agentName: agentName,
        documentId: url.id.toString()
      });
      
      toast.success("Website URL processed successfully");
      
      // Log activity
      await logClientActivity(
        "website_url_processed",
        `Processed website URL: ${url.url}`,
        { url: url.url }
      );
    } catch (error) {
      console.error("Error processing website URL:", error);
      toast.error("Failed to process website URL");
    } finally {
      setProcessingUrlId(null);
    }
  };

  return (
    <div className="space-y-4">
      {websiteUrls.length > 0 && (
        <WebsiteUrlsList
          urls={websiteUrls}
          onDelete={handleDelete}
          onProcess={handleProcessUrl}
          isDeleteLoading={deleteWebsiteUrlMutation.isPending}
          isProcessing={isProcessing}
          deletingId={deleteWebsiteUrlMutation.variables}
        />
      )}
      
      {showAddForm ? (
        <WebsiteUrlForm
          onAdd={handleAddUrl}
          onCancel={() => setShowAddForm(false)}
          isAddLoading={addWebsiteUrlMutation.isPending}
          clientId={clientId}
          agentName={agentName}
          isProcessing={isProcessing}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          + Add Website URL
        </button>
      )}
    </div>
  );
};
