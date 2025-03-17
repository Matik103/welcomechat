
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { DriveLink } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useDriveAccessCheck } from "@/hooks/useDriveAccessCheck";

interface DriveLinksProps {
  driveLinks: DriveLink[];
  onAdd: (data: { link: string; refresh_rate: number }) => Promise<void>;
  onDelete: (id: number) => void;
  isAddLoading: boolean;
  isDeleteLoading: boolean;
}

export const DriveLinks = ({
  driveLinks,
  onAdd,
  onDelete,
  isAddLoading,
  isDeleteLoading,
}: DriveLinksProps) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newRefreshRate, setNewRefreshRate] = useState(30);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkDriveAccess, validateDriveLink, isChecking } = useDriveAccessCheck();
  const [isValidated, setIsValidated] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLink(e.target.value);
    // Reset validation when link changes
    setIsValidated(false);
    setError(null);
    setFileId(null);
  };

  const validateLink = async () => {
    if (!newLink) {
      setError("Please enter a Google Drive link");
      return false;
    }

    // First validate the link format
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
        setError("Note: We can't verify if this Drive link is publicly accessible. Please ensure you've set sharing to 'Anyone with the link'.");
        // Still allow it but with a warning
      }
      
      setIsValidated(true);
      return true;
    } catch (e) {
      setError("Failed to validate Google Drive link");
      return false;
    }
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
      console.log("Submitting drive link:", newLink, newRefreshRate);
      await onAdd({
        link: newLink,
        refresh_rate: newRefreshRate,
      });
      
      setNewLink("");
      setNewRefreshRate(30);
      setShowNewForm(false);
      setIsValidated(false);
      setFileId(null);
    } catch (error) {
      console.error("Error adding link:", error);
      setError(error instanceof Error ? error.message : "Failed to add Google Drive link");
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

  const getShareSettingsUrl = () => {
    if (!fileId) return null;
    return `https://drive.google.com/drive/u/0/folders/${fileId}?usp=sharing`;
  };

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
        <div className="text-sm text-gray-500 italic">No Google Drive links added yet.</div>
      )}

      {!showNewForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewForm(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Google Drive Link
        </Button>
      ) : (
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
                  This is a valid Google Drive link format.
                </AlertDescription>
              </Alert>
            )}
            
            {isValidated && fileId && (
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
              <Label htmlFor="drive-link">Google Drive Link</Label>
              <div className="flex gap-2">
                <Input
                  id="drive-link"
                  type="url"
                  placeholder="https://drive.google.com/..."
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
      )}
    </div>
  );
};
