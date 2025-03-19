
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentUploadFormProps {
  onSubmit: (file: File, documentType: string) => Promise<void>;
  onCancel: () => void;
  isUploading: boolean;
  agentName: string | null;
}

export const DocumentUploadForm = ({
  onSubmit,
  onCancel,
  isUploading,
  agentName
}: DocumentUploadFormProps) => {
  const [documentType, setDocumentType] = useState<string>("google_drive");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      await onSubmit(file, documentType);
    } catch (error) {
      console.error("Error uploading document:", error);
      setError(error instanceof Error ? error.message : "Failed to upload document");
    }
  };

  return (
    <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleSubmit}>
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
            onClick={onCancel}
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
  );
};
