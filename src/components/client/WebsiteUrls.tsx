
import { useState } from "react";
import { WebsiteUrlForm } from "@/components/client/website-urls/WebsiteUrlForm";
import { WebsiteUrlsList } from "@/components/client/website-urls/WebsiteUrlsList";
import { WebsiteUrl } from "@/types/client";
import { toast } from "sonner";
import { useStoreWebsiteContent } from "@/hooks/useStoreWebsiteContent";
import { ActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { useDocumentProcessor } from "@/hooks/useDocumentProcessor";

interface WebsiteUrlsProps {
  clientId: string;
  agentName?: string;
  onAdd: (data: any) => Promise<any>;
  onDelete: (urlId: any) => Promise<any>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  logClientActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteUrls = ({ 
  clientId, 
  agentName = "AI Assistant", 
  onAdd,
  onDelete,
  isLoading,
  isAdding,
  isDeleting,
  logClientActivity
}: WebsiteUrlsProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [processingUrlId, setProcessingUrlId] = useState<number | null>(null);
  const webstoreHook = useStoreWebsiteContent(clientId);
  const { processDocument, isProcessing } = useDocumentProcessor(clientId);
  const [websiteUrls, setWebsiteUrls] = useState<WebsiteUrl[]>([]);

  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      const newUrl = await onAdd(data);
      setShowAddForm(false);
      
      // Log activity
      await logClientActivity(
        "website_url_added",
        `Added website URL: ${data.url}`,
        { url: data.url, refresh_rate: data.refresh_rate }
      );
      
      toast.success("Website URL added successfully");
      return newUrl;
    } catch (error) {
      console.error("Error adding website URL:", error);
      toast.error("Failed to add website URL");
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const deletedUrl = websiteUrls.find(url => url.id === id);
      await onDelete(id);
      
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
        file: new File([], "website_content.txt"), // Dummy file
        agentName: agentName,
        metadata: {
          url: url.url,
          documentType: "website_url",
          documentId: url.id.toString()
        }
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
          isDeleteLoading={isDeleting}
          isProcessing={isProcessing}
          deletingId={null}
        />
      )}
      
      {showAddForm ? (
        <WebsiteUrlForm
          clientId={clientId}
          onAddSuccess={() => setShowAddForm(false)}
          webstoreHook={webstoreHook}
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
