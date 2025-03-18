
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { DocumentLink } from "@/types/client";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface DocumentLinksProps {
  documentLinks: DocumentLink[];
  onAdd: (data: { link: string; refresh_rate: number; document_type?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpload: (file: File, agentName: string) => Promise<void>;
  isAddLoading: boolean;
  isDeleteLoading: boolean;
  isUploadLoading: boolean;
  agentName?: string;
}

const documentSchema = z.object({
  link: z.string().url("Please enter a valid URL"),
  refresh_rate: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().min(1, "Refresh rate must be at least 1 hour")
  ),
  document_type: z.string().min(1, "Document type is required")
});

const DOCUMENT_TYPES = [
  { value: "google_drive", label: "Google Drive Folder" },
  { value: "google_doc", label: "Google Doc" },
  { value: "google_sheet", label: "Google Sheet" },
  { value: "google_presentation", label: "Google Presentation" },
  { value: "pdf", label: "PDF Link" },
  { value: "web_page", label: "Web Page" },
  { value: "other", label: "Other Document" }
];

// Helper function to check if a document type is a Google resource
const isGoogleResource = (type: string): boolean => {
  return type === "google_drive" || 
         type === "google_doc" || 
         type === "google_sheet" ||
         type === "google_presentation";
};

export const DocumentLinks = ({
  documentLinks,
  onAdd,
  onDelete,
  onUpload,
  isAddLoading,
  isDeleteLoading,
  isUploadLoading,
  agentName
}: DocumentLinksProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("google_doc");
  const { checkDriveAccess, isChecking, lastResult } = useDriveAccessCheck();
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      link: "",
      refresh_rate: 24,
      document_type: "google_doc"
    }
  });

  // Watch for changes to document_type to update state
  const watchedDocType = watch("document_type");
  
  const handleAddLink = async (data: z.infer<typeof documentSchema>) => {
    // Only perform Google Drive access check for Google resources
    if (isGoogleResource(data.document_type)) {
      const accessCheckResult = await checkDriveAccess(data.link);
      
      if (accessCheckResult.error) {
        toast.error(`Invalid Google Drive link: ${accessCheckResult.error}`);
        return;
      }
      
      if (accessCheckResult.accessLevel === "restricted") {
        toast.warning("This Google Drive link has restricted access. Your AI agent may not be able to access it.");
      }
    }
    
    // Fix: Ensure we're passing all required properties
    await onAdd({
      link: data.link,
      refresh_rate: data.refresh_rate,
      document_type: data.document_type
    });
    
    reset();
  };

  const handleDelete = async (id: number) => {
    await onDelete(id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    
    if (!agentName) {
      toast.error("Agent name is not configured. Please set up an AI Agent Name in client settings before uploading documents.");
      return;
    }
    
    await onUpload(selectedFile, agentName);
    setSelectedFile(null);
    // Reset the file input by clearing the value
    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Check if agent name is configured
  const isAgentNameMissing = !agentName || agentName.trim() === "";

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-base font-medium mb-3">Add Document Link</h4>
          <form onSubmit={handleSubmit(handleAddLink)} className="space-y-4">
            <div>
              <Label htmlFor="document_type" className="text-sm">Document Type</Label>
              <Select 
                onValueChange={(value) => setDocumentType(value)}
                defaultValue={documentType}
                {...register("document_type")}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.document_type && (
                <p className="text-sm text-red-500 mt-1">{errors.document_type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="link" className="text-sm">Document URL</Label>
              <Input
                id="link"
                {...register("link")}
                placeholder="https://"
                className="mt-1"
              />
              {errors.link && (
                <p className="text-sm text-red-500 mt-1">{errors.link.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="refresh_rate" className="text-sm">Refresh Rate (hours)</Label>
              <Input
                id="refresh_rate"
                type="number"
                min="1"
                max="168"
                {...register("refresh_rate")}
                className="mt-1"
              />
              {errors.refresh_rate && (
                <p className="text-sm text-red-500 mt-1">{errors.refresh_rate.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">How often to re-index the document for updates</p>
            </div>

            <Button type="submit" disabled={isAddLoading}>
              {isAddLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Link
            </Button>
          </form>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Upload Document</h4>
          
          {isAgentNameMissing && (
            <Alert variant="warning" className="mb-4 border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Agent name is not configured. Please set up an AI Agent Name in client settings before uploading documents.
              </AlertDescription>
            </Alert>
          )}
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              selectedFile ? 'border-primary' : 'border-gray-200'
            } ${isAgentNameMissing ? 'opacity-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Selected file: <span className="font-medium">{selectedFile.name}</span>
                </p>
                <Button 
                  onClick={handleUploadSubmit} 
                  disabled={isUploadLoading || isAgentNameMissing}
                  className="w-full"
                >
                  {isUploadLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </Button>
                <button
                  onClick={() => setSelectedFile(null)}
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-full"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  Drag and drop a file here, or
                </p>
                <div>
                  <label htmlFor="fileUpload" className="inline-block">
                    <span className={`px-4 py-2 text-sm font-medium text-white rounded-md 
                                    ${isAgentNameMissing 
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-primary hover:bg-primary-dark cursor-pointer'}`}>
                      Select File
                    </span>
                    <input
                      id="fileUpload"
                      name="fileUpload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      disabled={isAgentNameMissing}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Supported file types: PDF, Word, Excel, PowerPoint, TXT, CSV
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {documentLinks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-base font-medium mb-3">Added Document Sources</h4>
          <div className="space-y-3">
            {documentLinks.map((link) => (
              <Card key={link.id} className="overflow-hidden">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium truncate">
                        {link.document_type 
                          ? DOCUMENT_TYPES.find(t => t.value === link.document_type)?.label || "Document" 
                          : "Document"}
                      </span>
                      
                      {isGoogleResource(link.document_type || '') && link.access_status === "restricted" && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Restricted
                        </span>
                      )}
                      
                      {isGoogleResource(link.document_type || '') && link.access_status === "public" && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-300">
                          Public
                        </span>
                      )}
                    </div>
                    <a 
                      href={link.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      {link.link}
                    </a>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Refresh rate: {link.refresh_rate} hour{link.refresh_rate !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    disabled={isDeleteLoading}
                    aria-label="Delete link"
                    className="text-gray-500 hover:text-red-500"
                  >
                    {isDeleteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {documentLinks.length === 0 && (
        <div className="py-2">
          <p className="text-gray-500 text-sm">No document links added yet.</p>
        </div>
      )}
    </div>
  );
};
