
import { useState, useEffect } from 'react';
import { DriveLinkForm } from './drive-links/DriveLinkForm';
import { DriveLinksList } from './drive-links/DriveLinksList';
import { DocumentLink } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { useClientActivity } from '@/hooks/useClientActivity';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDocumentProcessor } from '@/hooks/useDocumentProcessor';

interface DriveLinksProps {
  driveLinks: DocumentLink[];
  onAdd: (data: { link: string; refresh_rate: number; document_type: string }) => Promise<void>;
  onDelete: (linkId: number) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  agentName: string;
}

export const DriveLinks = ({ 
  driveLinks, 
  onAdd, 
  onDelete, 
  isLoading, 
  isAdding, 
  isDeleting,
  agentName
}: DriveLinksProps) => {
  const { logClientActivity } = useClientActivity();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clientInfo, setClientInfo] = useState({ clientName: '', agentName: '' });
  const { processDocument, isProcessing } = useDocumentProcessor();
  const [processingLinkId, setProcessingLinkId] = useState<number | null>(null);

  useEffect(() => {
    if (agentName) {
      const fetchClientInfo = async () => {
        try {
          const { data, error } = await supabase
            .from("ai_agents")
            .select("client_name, name")
            .eq("name", agentName)
            .single();

          if (error) {
            console.error("Error fetching client info:", error);
            return;
          }

          setClientInfo({
            clientName: data.client_name || '',
            agentName: data.name || ''
          });
        } catch (err) {
          console.error("Failed to fetch client info:", err);
        }
      };

      fetchClientInfo();
    }
  }, [agentName]);

  const handleAddLink = async (data: { 
    link: string; 
    document_type: "google_drive" | "text" | "google_doc" | "google_sheet" | "pdf" | "other"; 
    refresh_rate: number; 
  }) => {
    try {
      // Ensure data has required format
      const formattedData = {
        link: data.link,
        refresh_rate: data.refresh_rate || 30,
        document_type: data.document_type || 'google_drive'
      };
      
      await onAdd(formattedData);
      setShowAddForm(false);
      
      await logClientActivity(
        "drive_link_added",
        `Added ${data.document_type || 'document'} link: ${data.link}`,
        {
          link: data.link,
          refresh_rate: data.refresh_rate,
          document_type: data.document_type
        }
      );
      
      toast.success(`${data.document_type || 'Document'} link added successfully`);
    } catch (error) {
      console.error("Error adding drive link:", error);
      toast.error("Failed to add document link");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const deletedLink = driveLinks.find(link => link.id === id);
      await onDelete(id);
      
      if (deletedLink) {
        await logClientActivity(
          "drive_link_deleted",
          `Deleted ${deletedLink.document_type || 'document'} link: ${deletedLink.link}`,
          {
            link: deletedLink.link,
            document_type: deletedLink.document_type
          }
        );
      }
      
      toast.success("Document link deleted successfully");
    } catch (error) {
      console.error("Error deleting drive link:", error);
      toast.error("Failed to delete document link");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      await processDocument({
        file,
        agentName,
      });
      
      await logClientActivity(
        "document_uploaded",
        `Uploaded document: ${file.name}`,
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      );
      
      setShowFileUploader(false);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessLink = async (link: DocumentLink) => {
    setProcessingLinkId(link.id);
    
    try {
      await processDocument({
        file: new File([""], "placeholder.txt"), // Dummy file
        agentName: agentName,
        metadata: {
          documentUrl: link.link,
          documentType: link.document_type,
          documentId: link.id.toString()
        }
      });
      
      toast.success("Document processed successfully");
      
      await logClientActivity(
        "document_processed",
        `Processed document: ${link.document_type} link`,
        {
          link: link.link,
          document_type: link.document_type
        }
      );
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Failed to process document");
    } finally {
      setProcessingLinkId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between">
        <h3 className="text-lg font-medium">Document Links</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setShowAddForm(false);
              setShowFileUploader(!showFileUploader);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            {showFileUploader ? "Cancel Upload" : "Upload File"}
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              setShowFileUploader(false);
              setShowAddForm(!showAddForm);
            }}
            variant={showAddForm ? "outline" : "default"}
          >
            {showAddForm ? "Cancel" : "Add Link"}
          </Button>
        </div>
      </div>
      
      {showFileUploader && (
        <FileUploader 
          onUpload={handleFileUpload} 
          isUploading={isUploading} 
          accept=".pdf,.doc,.docx,.txt,.md"
        />
      )}
      
      {showAddForm && (
        <DriveLinkForm 
          onSubmit={handleAddLink}
          isSubmitting={isAdding}
        />
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DriveLinksList 
          links={driveLinks} 
          onDelete={handleDelete} 
          onProcess={handleProcessLink}
          isDeleting={isDeleting}
          isProcessing={isProcessing}
          processingLinkId={processingLinkId}
          deletingLinkId={null}
        />
      )}
    </div>
  );
};
