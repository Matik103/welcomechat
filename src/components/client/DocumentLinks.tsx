import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertTriangle, CheckCircle2, ExternalLink, FileUp, FileText, PlusCircle } from "lucide-react";
import { DocumentLink } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocumentProcessor } from "@/hooks/useDocumentProcessor";
import { toast } from "sonner";

interface DocumentLinksProps {
  documentLinks: DocumentLink[];
  onAdd: (data: { link: string; refresh_rate: number; document_type?: string }) => Promise<void>;
  onDelete: (id: number) => void;
  onUpload: (file: File, agentName: string) => Promise<void>;
  isAddLoading: boolean;
  isDeleteLoading: boolean;
  isUploadLoading: boolean;
  agentName?: string;
  clientId?: string;
}

export const DocumentLinks = ({
  documentLinks,
  onAdd,
  onDelete,
  onUpload,
  isAddLoading,
  isDeleteLoading,
  isUploadLoading,
  agentName: initialAgentName,
  clientId
}: DocumentLinksProps) => {
  const [activeTab, setActiveTab] = useState("link");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [documentType, setDocumentType] = useState("google_drive");
  const [newRefreshRate, setNewRefreshRate] = useState(30);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkDriveAccess, validateDriveLink, isChecking } = useDriveAccessCheck();
  const [isValidated, setIsValidated] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [agentName, setAgentName] = useState<string | undefined>(initialAgentName);
  const [isLoadingAgentName, setIsLoadingAgentName] = useState(false);
  const { processDocument, isProcessing } = useDocumentProcessor();

  const documentTypeConfig = {
    google_drive: {
      placeholder: "https://drive.google.com/drive/folders/...",
      validationRegex: /drive\.google\.com|docs\.google\.com/i,
      helperText: "Enter a Google Drive folder or file link",
    },
    google_doc: {
      placeholder: "https://docs.google.com/document/d/...",
      validationRegex: /docs\.google\.com\/document/i,
      helperText: "Enter a Google Doc document link",
    },
    google_sheet: {
      placeholder: "https://docs.google.com/spreadsheets/d/...",
      validationRegex: /docs\.google\.com\/spreadsheets/i,
      helperText: "Enter a Google Sheet spreadsheet link",
    },
    pdf: {
      placeholder: "https://example.com/document.pdf",
      validationRegex: /\.pdf$/i,
      helperText: "Enter a link to a PDF document (must end with .pdf)",
    },
    excel: {
      placeholder: "https://example.com/spreadsheet.xlsx",
      validationRegex: /\.(xlsx|xls|csv)$/i,
      helperText: "Enter a link to an Excel file (must end with .xlsx, .xls, or .csv)",
    },
    document: {
      placeholder: "https://example.com/document.docx",
      validationRegex: /\.(docx|doc|txt)$/i,
      helperText: "Enter a link to a document file (must end with .docx, .doc, or .txt)",
    },
    other: {
      placeholder: "https://example.com/resource",
      validationRegex: /.+/,
      helperText: "Enter any resource link",
    }
  };

  const currentConfig = documentTypeConfig[documentType as keyof typeof documentTypeConfig] || documentTypeConfig.other;

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setIsValidated(false);
    setError(null);
    setFileId(null);
  };

  useEffect(() => {
    const fetchAgentName = async () => {
      if (!clientId) return;
      
      setIsLoadingAgentName(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("agent_name")
          .eq("id", clientId)
          .single();

        if (error) {
          console.error("Error fetching agent name:", error);
        } else {
          console.log("Fetched agent name:", data.agent_name);
          setAgentName(data.agent_name);
        }
      } catch (error) {
        console.error("Error in fetchAgentName:", error);
      } finally {
        setIsLoadingAgentName(false);
      }
    };

    fetchAgentName();
  }, [clientId]);

  useEffect(() => {
    if (showNewForm && clientId) {
      const fetchAgentName = async () => {
        setIsLoadingAgentName(true);
        try {
          const { data, error } = await supabase
            .from("clients")
            .select("agent_name")
            .eq("id", clientId)
            .single();
  
          if (error) {
            console.error("Error fetching agent name:", error);
          } else {
            console.log("Fetched agent name on form open:", data.agent_name);
            setAgentName(data.agent_name);
          }
        } catch (error) {
          console.error("Error in fetchAgentName on form open:", error);
        } finally {
          setIsLoadingAgentName(false);
        }
      };
  
      fetchAgentName();
    }
  }, [showNewForm, clientId]);

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLink(e.target.value);
    setIsValidated(false);
    setError(null);
    setFileId(null);
  };

  const validateLink = async () => {
    if (!newLink) {
      setError("Please enter a document link");
      return false;
    }

    const config = documentTypeConfig[documentType as keyof typeof documentTypeConfig];
    if (!config.validationRegex.test(newLink)) {
      setError(`Invalid ${documentType.replace('_', ' ')} link format. ${config.helperText}`);
      return false;
    }

    if (documentType === "google_drive" || documentType === "google_doc" || documentType === "google_sheet") {
      const validation = validateDriveLink(newLink);
      if (!validation.isValid) {
        setError(validation.error);
        return false;
      }
      setFileId(validation.fileId);
    } else {
      try {
        new URL(newLink);
      } catch (e) {
        setError("Please enter a valid URL");
        return false;
      }
    }
    
    setIsValidated(true);
    return true;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleAdd called with link:", newLink);
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
      
      if (clientId && agentName) {
        try {
          const documentId = `${Date.now()}_${documentType}`;
          
          toast.info("Processing document content...");
          
          await processDocument({
            documentUrl: newLink,
            documentType: documentType,
            clientId,
            agentName,
            documentId
          });
        } catch (processingError) {
          console.error("Error processing document:", processingError);
          toast.error(`Document added but content processing failed: ${processingError.message}`);
        }
      }
      
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    if (!agentName) {
      setError("Agent name is required. Please configure it in the client settings.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await onUpload(selectedFile, agentName);
      
      setSelectedFile(null);
      setShowNewForm(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareSettingsUrl = () => {
    if (!fileId) return null;
    return `https://drive.google.com/drive/u/0/folders/${fileId}?usp=sharing`;
  };

  const renderDocumentTypeIcon = (link: DocumentLink) => {
    switch (link.document_type) {
      case "google_drive":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "google_doc":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "google_sheet":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "excel":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "document":
        return <FileText className="h-4 w-4 text-indigo-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDocumentTypeName = (type: string | undefined) => {
    if (!type) return "Unknown";
    
    switch (type) {
      case "google_drive": return "Google Drive";
      case "google_doc": return "Google Doc";
      case "google_sheet": return "Google Sheet";
      case "pdf": return "PDF";
      case "excel": return "Excel";
      case "document": return "Document";
      default: return type.replace('_', ' ');
    }
  };

  const getAddButtonText = () => {
    if (isAddLoading || isSubmitting) {
      return "Adding...";
    } else if (isProcessing) {
      return "Processing...";
    } else {
      return "Add Link";
    }
  };

  return (
    <div className="space-y-4">
      {documentLinks.length > 0 ? (
        <div className="space-y-2">
          {documentLinks.map((link) => (
            <div 
              key={link.id} 
              className="flex items-center gap-2 p-3 rounded-md border bg-gray-50 border-gray-200"
            >
              {renderDocumentTypeIcon(link)}
              <div className="flex-1 truncate text-sm">
                {link.link}
              </div>
              {link.document_type && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {getDocumentTypeName(link.document_type)}
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

      {!showNewForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewForm(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Document Source
        </Button>
      ) : (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="link">Add Document Link</TabsTrigger>
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link">
              <form onSubmit={handleAdd} className="space-y-4">
                {error && !error.includes("Note:") && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {error && error.includes("Note:") && (
                  <Alert variant="warning" className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {isValidated && (
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Link Validated</AlertTitle>
                    <AlertDescription className="text-green-700">
                      This is a valid {getDocumentTypeName(documentType)} link.
                    </AlertDescription>
                  </Alert>
                )}
                
                {isValidated && fileId && (documentType === "google_drive" || documentType === "google_doc" || documentType === "google_sheet") && (
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
                    onValueChange={handleDocumentTypeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google_drive">Google Drive</SelectItem>
                      <SelectItem value="google_doc">Google Doc</SelectItem>
                      <SelectItem value="google_sheet">Google Sheet</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">{currentConfig.helperText}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document-link">Document Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="document-link"
                      type="url"
                      placeholder={currentConfig.placeholder}
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
                    disabled={isAddLoading || isSubmitting || !newLink || (isChecking && !isValidated) || isProcessing}
                  >
                    {(isAddLoading || isSubmitting || isProcessing) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {getAddButtonText()}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="upload">
              <form onSubmit={handleFileUpload} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {isLoadingAgentName ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : !agentName ? (
                  <Alert variant="warning" className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Agent name is not configured. Please set up an AI Agent Name in client settings before uploading documents.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Agent Name Configured</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Using agent name: <span className="font-medium">{agentName}</span>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <FileUp className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Drag and drop a file here, or
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Select File
                      </Button>
                      <p className="text-xs text-gray-500">
                        Supported file types: PDF, Word, Excel, PowerPoint, TXT, CSV
                      </p>
                    </div>
                  )}
                </div>
                
                {selectedFile && (
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">File Selected</AlertTitle>
                    <AlertDescription className="text-green-700">
                      This file will be uploaded to your AI agent's knowledge base when you click "Upload Document".
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowNewForm(false);
                      setError(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isUploadLoading || isSubmitting || !selectedFile || !agentName}
                  >
                    {(isUploadLoading || isSubmitting) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <FileUp className="w-4 h-4 mr-2" />
                    )}
                    Upload Document
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};
