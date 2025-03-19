
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Upload } from "lucide-react";
import { DocumentLink } from "@/types/client";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDocumentProcessor } from "@/hooks/useDocumentProcessor";
import { 
  DocumentLinksList, 
  DocumentLinkForm, 
  DocumentUploadForm,
  AgentNameWarning
} from "./drive-links";

interface DriveLinksProps {
  driveLinks: DocumentLink[];
  onAdd: (data: { link: string; refresh_rate: number; document_type?: string }) => Promise<void>;
  onDelete: (id: number) => void;
  isAddLoading: boolean;
  isDeleteLoading: boolean;
  clientId: string;
}

export const DriveLinks = ({
  driveLinks,
  onAdd,
  onDelete,
  isAddLoading,
  isDeleteLoading,
  clientId
}: DriveLinksProps) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{ 
    client_name?: string; 
    agent_name?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { processDocument, isProcessing } = useDocumentProcessor();

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching client data for ID:", clientId);
        const { data, error } = await supabase
          .from("clients")
          .select("client_name, agent_name")
          .eq("id", clientId)
          .single();

        if (error) {
          console.error("Error fetching client data:", error);
          throw error;
        }

        if (data) {
          console.log("Fetched client data:", data);
          setClientData(data);
          if (data.agent_name) {
            console.log("Setting agent name:", data.agent_name);
            setAgentName(data.agent_name);
          } else {
            console.log("No agent name found in client data");
            setAgentName(null);
          }
        } else {
          console.log("No client data found");
          setClientData({});
          setAgentName(null);
        }
      } catch (err) {
        console.error("Error in fetchClientData:", err);
        toast.error("Failed to load client information");
        setClientData({});
        setAgentName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleAdd = async (data: { link: string; refresh_rate: number; document_type: string }) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting document link:", data.link, data.refresh_rate, data.document_type);
      
      await onAdd({
        link: data.link,
        refresh_rate: data.refresh_rate,
        document_type: data.document_type
      });
      
      try {
        const documentId = `drive_${Date.now()}`;
        
        toast.info("Processing document content...");
        
        await processDocument({
          documentUrl: data.link,
          documentType: data.document_type,
          clientId,
          agentName: agentName || "",
          documentId
        });
      } catch (processingError) {
        console.error("Error processing document:", processingError);
        toast.error(`Document link added but content processing failed: ${processingError instanceof Error ? processingError.message : "Unknown error"}`);
      }
      
      setShowNewForm(false);
    } catch (error) {
      console.error("Error adding link:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async (file: File, documentType: string) => {
    try {
      setIsUploading(true);
      
      const filePath = `${clientId}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      
      const { data: urlData } = await supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData.publicUrl;
      
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: agentName || "",
          content: `File uploaded: ${file.name}`,
          url: fileUrl,
          interaction_type: "document_upload",
          settings: {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            document_type: documentType,
            uploaded_at: new Date().toISOString()
          }
        })
        .select("id")
        .single();
      
      if (agentError) {
        throw new Error(`Failed to store document in knowledge base: ${agentError.message}`);
      }
      
      setShowUploadForm(false);
      toast.success("Document uploaded successfully!");
      
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Error deleting link:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!agentName && !showNewForm && !showUploadForm) {
    return (
      <div className="space-y-4">
        <AgentNameWarning show={true} />
        
        <DocumentLinksList 
          links={driveLinks} 
          onDelete={handleDelete} 
          isDeleteLoading={isDeleteLoading} 
          deletingId={deletingId} 
        />
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNewForm(true)}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Document Link
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUploadForm(true)}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DocumentLinksList 
        links={driveLinks} 
        onDelete={handleDelete} 
        isDeleteLoading={isDeleteLoading} 
        deletingId={deletingId} 
      />

      {!showNewForm && !showUploadForm ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNewForm(true)}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Document Link
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUploadForm(true)}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      ) : showNewForm ? (
        <DocumentLinkForm 
          onSubmit={handleAdd}
          onCancel={() => {
            setShowNewForm(false);
          }}
          isSubmitting={isSubmitting || isAddLoading}
          isProcessing={isProcessing}
          agentName={agentName}
        />
      ) : (
        <DocumentUploadForm 
          onSubmit={handleUpload}
          onCancel={() => {
            setShowUploadForm(false);
          }}
          isUploading={isUploading}
          agentName={agentName}
        />
      )}
    </div>
  );
};
