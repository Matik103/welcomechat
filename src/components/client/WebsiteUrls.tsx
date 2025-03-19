
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDocumentProcessor } from "@/hooks/useDocumentProcessor";
import { toast } from "sonner";
import { 
  WebsiteUrlsList, 
  ValidationResult, 
  ScrapabilityInfo 
} from "@/components/client/website-urls";
import { WebsiteUrlForm } from "@/components/client/website-urls/WebsiteUrlForm";
import { WebsiteUrl } from "@/types/client";

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: { url: string; refresh_rate: number }) => Promise<void>;
  onDelete: (urlId: number) => Promise<void>;
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
  agentName
}: WebsiteUrlsProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { processWebsiteUrl, isProcessing } = useDocumentProcessor();
  
  const handleAdd = async (data: { url: string; refresh_rate: number }) => {
    try {
      await onAdd(data);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error in handleAdd:", error);
    }
  };
  
  const handleCancel = () => {
    setShowAddForm(false);
  };
  
  const handleProcess = async (url: WebsiteUrl) => {
    if (!clientId) {
      toast.error("Client ID is required to process the website URL");
      return;
    }
    
    try {
      await processWebsiteUrl(clientId, url.url, url.id.toString());
      toast.success("Website URL processing initiated");
    } catch (error) {
      console.error("Error processing website URL:", error);
      toast.error("Failed to process website URL");
    }
  };

  return (
    <div className="space-y-4">
      {urls.length > 0 && (
        <WebsiteUrlsList 
          urls={urls} 
          onDelete={onDelete} 
          onProcess={handleProcess}
          isDeleteLoading={isDeleteLoading}
          isProcessing={isProcessing}
        />
      )}
      
      {showAddForm ? (
        <WebsiteUrlForm
          onAdd={handleAdd}
          onCancel={handleCancel}
          isAddLoading={isAddLoading}
          clientId={clientId}
          agentName={agentName}
          isProcessing={isProcessing}
        />
      ) : (
        <Button 
          onClick={() => setShowAddForm(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Website URL
        </Button>
      )}
    </div>
  );
};
