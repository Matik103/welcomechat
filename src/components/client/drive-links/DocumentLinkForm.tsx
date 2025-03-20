import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";
import { ValidationResult } from "./ValidationResult";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Plus } from "lucide-react";

interface DocumentLinkFormProps {
  onSubmit: (data: { link: string; refresh_rate: number; document_type: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isProcessing: boolean;
  agentName: string | null;
}

export const DocumentLinkForm = ({
  onSubmit,
  onCancel,
  isSubmitting,
  isProcessing,
  agentName
}: DocumentLinkFormProps) => {
  const [documentType, setDocumentType] = useState<string>("google_drive");
  const [documentLink, setDocumentLink] = useState<string>("");
  const [refreshRate, setRefreshRate] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const { checkDriveAccess, isChecking, lastResult } = useDriveAccessCheck();
  const [isValidated, setIsValidated] = useState(false);

  const validateLink = async () => {
    if (!documentLink) {
      setError("Please enter a document link");
      return false;
    }

    if (!documentLink.includes("drive.google.com") && !documentLink.includes("docs.google.com") && documentType.includes("google")) {
      setError("Please enter a valid Google Drive link for the selected document type");
      return false;
    }

    try {
      new URL(documentLink);
    } catch (e) {
      setError("Please enter a valid URL");
      return false;
    }

    try {
      // For now, we'll just check if URL is valid
      // Later could add more specific validation for different document types
      setIsValidated(true);
      return true;
    } catch (e) {
      setError("Failed to validate link");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!agentName) {
      setError("Agent name is not configured. Please set up an Agent Name in client settings before adding document links.");
      return;
    }
    
    if (!isValidated) {
      const isValid = await validateLink();
      if (!isValid) return;
    }
    
    try {
      await onSubmit({
        link: documentLink,
        refresh_rate: refreshRate,
        document_type: documentType
      });
    } catch (error) {
      console.error("Error submitting document link:", error);
      setError(error instanceof Error ? error.message : "Failed to add document link");
    }
  };

  const getProcessingMethod = () => {
    if (documentType === "google_doc" || documentType === "excel" || 
        documentType === "pdf" || documentType === "powerpoint" ||
        (documentLink.includes("drive.google.com") && !documentLink.includes("/folders/"))) {
      return "LlamaParse";
    }
    return "Firecrawl";
  };

  const getProcessingText = () => {
    if (isProcessing) {
      return `Processing with ${getProcessingMethod()}...`;
    }
    
    if (isSubmitting) {
      return "Adding...";
    }
    
    return "Add Document Link";
  };

  return (
    <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {!agentName && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Agent name is not configured. Please set up an Agent Name in client settings before adding document links.
            </AlertDescription>
          </Alert>
        )}
        
        <ValidationResult error={error} isValidated={isValidated} />
        
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
              <SelectItem value="excel">Excel / Spreadsheet</SelectItem>
              <SelectItem value="powerpoint">PowerPoint / Presentation</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {documentType === "google_doc" || documentType === "excel" || 
             documentType === "pdf" || documentType === "powerpoint" 
             ? "This document will be processed using LlamaParse" 
             : "This document will be processed using Firecrawl"}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="document-link">Document Link</Label>
          <Input
            id="document-link"
            type="url"
            placeholder={documentType.includes("google") ? "https://drive.google.com/..." : "https://..."}
            value={documentLink}
            onChange={(e) => {
              setDocumentLink(e.target.value);
              setIsValidated(false);
              setError(null);
            }}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="refresh-rate">Refresh Rate (days)</Label>
          <Input
            id="refresh-rate"
            type="number"
            min="1"
            value={refreshRate}
            onChange={(e) => setRefreshRate(parseInt(e.target.value))}
            required
          />
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
            disabled={isSubmitting || !documentLink || isProcessing}
          >
            {(isSubmitting || isProcessing) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {getProcessingText()}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Document Link
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
