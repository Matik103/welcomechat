
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertTriangle, CheckCircle2, ExternalLink, Upload } from "lucide-react";
import { DocumentLink } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [newLink, setNewLink] = useState("");
  const [newRefreshRate, setNewRefreshRate] = useState(30);
  const [documentType, setDocumentType] = useState<string>("google_drive");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkDriveAccess, validateDriveLink, isChecking } = useDriveAccessCheck();
  const [isValidated, setIsValidated] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{ 
    client_name?: string; 
    agent_name?: string;
    agent_description?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client data when component mounts
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
        // Make sure to initialize the clientData state to prevent NULL errors
        setClientData({});
        setAgentName(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLink(e.target.value);
    // Reset validation when link changes
    setIsValidated(false);
    setError(null);
    setFileId(null);
  };

  const validateLink = async () => {
    if (!newLink) {
      setError("Please enter a document link");
      return false;
    }

    // For Google Drive links, validate format
    if (documentType === "google_drive" || documentType === "google_doc") {
      const validation = validateDriveLink(newLink);
      if (!validation.isValid) {
        setError(validation.error);
        return false;
      }

      setFileId(validation.fileId);
      
      try {
        const result = await checkDriveAccess(newLink);
        
        if (result.error && result.error !== "Google Drive access checking requires authentication which is not currently set up") {
          setError(`Error validating Drive link: ${result.error}`);
          return false;
        }
        
        // Show a warning about not being able to check access
        if (result.accessLevel === "unknown") {
          setError("Note: We can't verify if this link is publicly accessible. Please ensure you've set sharing to 'Anyone with the link'.");
        }
      } catch (e) {
        setError("Failed to validate link");
        return false;
      }
    } else {
      // For other document types, just check if it's a valid URL
      try {
        new URL(newLink);
      } catch (_) {
        setError("Please enter a valid URL");
        return false;
      }
    }
    
    setIsValidated(true);
    return true;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agentName) {
      setError("Agent name is not configured. Please set up an AI Agent Name in client settings before adding documents.");
      return;
    }
    
    setError(null);
    
    if (!isValidated) {
      const isValid = await validateLink();
      if (!isValid) return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting document link:", newLink, newRefreshRate, documentType);
      await onAdd({
        link: newLink,
        refresh_rate: newRefreshRate,
        document_type: documentType
      });
      
      setNewLink("");
      setNewRefreshRate(30);
      setShowNewForm(false);
      setIsValidated(false);
      setFileId(null);
    } catch (error) {
      console.error("Error adding link:", error);
      setError(error instanceof Error ? error.message : "Failed to add document link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agentName) {
      setError("Agent name is not configured. Please set up an AI Agent Name in client settings before uploading documents.");
      return;
    }
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a storage path based on client ID and file name
      const filePath = `${clientId}/${Date.now()}_${file.name}`;
      
      // Upload the file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client_documents')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      
      // Get the public URL of the uploaded file
      const { data: urlData } = await supabase.storage
        .from('client_documents')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData.publicUrl;
      
      // Store the document content in the AI agent's knowledge base
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: clientId,
          name: agentName,
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
      
      setFile(null);
      setShowUploadForm(false);
      setDocumentType("google_drive");
      toast.success("Document uploaded successfully!");
      
    } catch (error) {
      console.error("Error uploading document:", error);
      setError(error instanceof Error ? error.message : "Failed to upload document");
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

  const getShareSettingsUrl = () => {
    if (!fileId) return null;
    return `https://drive.google.com/drive/u/0/folders/${fileId}?usp=sharing`;
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "google_drive": return "Google Drive";
      case "google_doc": return "Google Doc";
      case "excel": return "Excel";
      case "pdf": return "PDF";
      case "other": return "Other";
      default: return type;
    }
  };

  // Show loading state while client data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // Show missing agent name alert if not configured
  if (!agentName && !showNewForm && !showUploadForm) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Agent Name Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            Agent name is not configured. Please set up an AI Agent Name in client settings before adding documents.
          </AlertDescription>
        </Alert>
        
        {driveLinks.length > 0 ? (
          <div className="space-y-2">
            {driveLinks.map((link) => (
              <div 
                key={link.id} 
                className="flex items-center gap-2 p-3 rounded-md border bg-gray-50 border-gray-200"
              >
                <div className="flex-1 truncate text-sm">
                  {link.link}
                </div>
                {link.document_type && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {getDocumentTypeLabel(link.document_type)}
                  </span>
                )}
                <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(link.id)}
                  disabled={isDeleteLoading || deletingId === link.id}
                  className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  {(isDeleteLoading && deletingId === link.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No document links added yet.</div>
        )}
        
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
      {driveLinks.length > 0 ? (
        <div className="space-y-2">
          {driveLinks.map((link) => (
            <div 
              key={link.id} 
              className="flex items-center gap-2 p-3 rounded-md border bg-gray-50 border-gray-200"
            >
              <div className="flex-1 truncate text-sm">
                {link.link}
              </div>
              {link.document_type && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {getDocumentTypeLabel(link.document_type)}
                </span>
              )}
              <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(link.id)}
                disabled={isDeleteLoading || deletingId === link.id}
                className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {(isDeleteLoading && deletingId === link.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">No document links added yet.</div>
      )}

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
        <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleAdd}>
          <div className="space-y-4">
            {error && (
              <Alert variant={error.includes("Note:") ? "warning" : "destructive"} className={error.includes("Note:") ? "bg-amber-50 border-amber-200" : ""}>
                {error.includes("Note:") ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription className={error.includes("Note:") ? "text-amber-700" : ""}>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {isValidated && (
              <Alert variant="success" className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Link Validated</AlertTitle>
                <AlertDescription className="text-green-700">
                  This is a valid document link format.
                </AlertDescription>
              </Alert>
            )}
            
            {isValidated && fileId && documentType === "google_drive" && (
              <div className="text-sm bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="font-medium text-blue-800 mb-2">Make sure your Google Drive content is shared properly:</p>
                <ol className="list-decimal list-inside text-blue-700 space-y-1 ml-2">
                  <li>Open your Google Drive file/folder</li>
                  <li>Click "Share" in the top-right</li>
                  <li>Set access to "Anyone with the link"</li>
                </ol>
                <div className="mt-2">
                  <a 
                    href={getShareSettingsUrl()}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline"
                  >
                    Open sharing settings <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={documentType}
                onValueChange={setDocumentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="google_doc">Google Doc</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document-link">Document Link</Label>
              <div className="flex gap-2">
                <Input
                  id="document-link"
                  type="url"
                  placeholder="https://docs.google.com/..."
                  value={newLink}
                  onChange={handleLinkChange}
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={validateLink}
                  disabled={isChecking || !newLink || isValidated}
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Validate
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refresh-rate">Refresh Rate (days)</Label>
              <Input
                id="refresh-rate"
                type="number"
                min="1"
                value={newRefreshRate}
                onChange={(e) => setNewRefreshRate(parseInt(e.target.value) || 30)}
                required
              />
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowNewForm(false);
                  setError(null);
                  setIsValidated(false);
                  setFileId(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isAddLoading || isSubmitting || !newLink || (isChecking && !isValidated)}
              >
                {(isAddLoading || isSubmitting) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Link
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleUpload}>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="document-type-upload">Document Type</Label>
              <Select
                value={documentType}
                onValueChange={setDocumentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_drive">Google Drive</SelectItem>
                  <SelectItem value="google_doc">Google Doc</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document-file">Document File</Label>
              <Input
                id="document-file"
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Supported file types: PDF, DOCX, XLSX, CSV, TXT (max 10MB)
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowUploadForm(false);
                  setError(null);
                  setFile(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isUploading || !file}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Document
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
