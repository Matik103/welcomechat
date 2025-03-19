
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Plus } from "lucide-react";
import { ValidationResult } from "./ValidationResult";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";

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
  const [newLink, setNewLink] = useState("");
  const [newRefreshRate, setNewRefreshRate] = useState(30);
  const [documentType, setDocumentType] = useState<string>("google_drive");
  const [error, setError] = useState<string | null>(null);
  const { checkDriveAccess, validateDriveLink, isChecking } = useDriveAccessCheck();
  const [isValidated, setIsValidated] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);

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
        
        if (result.accessLevel === "unknown") {
          setError("Note: We can't verify if this link is publicly accessible. Please ensure you've set sharing to 'Anyone with the link'.");
        }
      } catch (e) {
        setError("Failed to validate link");
        return false;
      }
    } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await onSubmit({
        link: newLink,
        refresh_rate: newRefreshRate,
        document_type: documentType
      });
    } catch (error) {
      console.error("Error adding link:", error);
      setError(error instanceof Error ? error.message : "Failed to add document link");
    }
  };

  const getShareSettingsUrl = () => {
    if (!fileId) return null;
    return `https://drive.google.com/drive/u/0/folders/${fileId}?usp=sharing`;
  };

  return (
    <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <ValidationResult error={error} isValidated={isValidated} />
        
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
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || !newLink || (isChecking && !isValidated) || isProcessing}
          >
            {(isSubmitting || isProcessing) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isProcessing ? "Processing..." : "Adding..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Link
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
