
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, FilePlus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { DocumentLinkForm } from './drive-links/DocumentLinkForm';
import { DocumentLink } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useDriveAccessCheck } from '@/hooks/useDriveAccessCheck';
import { supabase } from '@/integrations/supabase/client';

interface DocumentLinksProps {
  driveLinks: DocumentLink[];
  onAdd: (data: { link: string; refresh_rate: number; document_type: string }) => Promise<void>;
  onDelete: (linkId: number) => Promise<void>;
  onUpload?: (file: File, agentName: string) => Promise<void>;
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  agentName: string;
}

export const DocumentLinks = ({
  driveLinks,
  onAdd,
  onDelete,
  onUpload,
  isLoading,
  isAdding,
  isDeleting,
  agentName
}: DocumentLinksProps) => {
  const [showForm, setShowForm] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ client_name?: string; agent_name?: string }>({});

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
            client_name: data.client_name,
            agent_name: data.name
          });
        } catch (err) {
          console.error("Failed to fetch client info:", err);
        }
      };

      fetchClientInfo();
    }
  }, [agentName]);

  const accessStatusColors = {
    accessible: "bg-green-100 text-green-800",
    inaccessible: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800"
  };

  const documentTypes = {
    "google_doc": "Google Doc",
    "google_sheet": "Google Sheet",
    "google_drive": "Google Drive",
    "pdf": "PDF",
    "text": "Text",
    "other": "Other"
  };

  const handleFormToggle = () => {
    setShowForm(!showForm);
  };

  const checkDriveAccess = async (linkId: number) => {
    try {
      const { data, error } = await supabase
        .from("document_links")
        .update({ access_status: "unknown" })
        .eq("id", linkId)
        .select();

      if (error) {
        console.error("Error updating access status:", error);
      }
    } catch (err) {
      console.error("Failed to check drive access:", err);
    }
  };

  const handleSubmit = async (formData: { 
    link?: string; 
    document_type?: "google_drive" | "text" | "google_doc" | "google_sheet" | "pdf" | "other"; 
    refresh_rate?: number; 
  }) => {
    // Ensure all required properties are set with defaults if not provided
    const data = {
      link: formData.link || '',
      refresh_rate: formData.refresh_rate || 30,
      document_type: formData.document_type || 'google_drive'
    };
    
    await onAdd(data);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Document Links</h3>
        <Button 
          onClick={handleFormToggle} 
          variant={showForm ? "outline" : "default"}
          size="sm"
        >
          {showForm ? "Cancel" : "Add Document Link"}
        </Button>
      </div>

      {showForm && (
        <DocumentLinkForm 
          onSubmit={handleSubmit}
          isSubmitting={isAdding}
          agentName={agentName}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : driveLinks.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <div className="flex flex-col items-center space-y-2">
            <FilePlus className="h-12 w-12 mb-2" />
            <p>No document links added yet</p>
            <p className="text-sm">Add a Google Drive link or upload a document to get started</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {driveLinks.map((link) => {
            const DocumentAccessStatus = () => {
              const { accessStatus, isLoading } = useDriveAccessCheck(link.id);
              
              return (
                <Badge 
                  className={`${accessStatusColors[accessStatus]} ml-2`}
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    accessStatus === 'inaccessible' && (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )
                  )}
                  {accessStatus === 'accessible' ? 'Accessible' : 
                   accessStatus === 'inaccessible' ? 'Access Error' : 'Unknown'}
                </Badge>
              );
            };

            return (
              <Card key={link.id} className="p-4">
                <div className="flex justify-between">
                  <div className="space-y-1 flex-1 mr-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {documentTypes[link.document_type as keyof typeof documentTypes] || "Document"}
                      </Badge>
                      <DocumentAccessStatus />
                    </div>
                    <a 
                      href={link.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {link.link}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                      {link.refresh_rate && ` • Refresh every ${link.refresh_rate} days`}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => checkDriveAccess(link.id)}
                      title="Check access"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDelete(link.id)}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
                      title="Delete link"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
