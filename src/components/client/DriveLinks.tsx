import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Lock, Globe, AlertTriangle } from "lucide-react";
import { DriveLink } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useUrlValidation } from "@/hooks/useUrlValidation";

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
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const { validateUrl, isValidating } = useUrlValidation();

  const validateRefreshRate = (rate: number): string | null => {
    if (rate < 1) {
      return "Refresh rate must be at least 1 day";
    }
    if (rate > 365) {
      return "Refresh rate cannot exceed 365 days";
    }
    return null;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleAdd called with link:", newLink);
    setError(null);
    setValidationWarning(null);
    
    if (!newLink) {
      setError("Please enter a Google Drive link");
      return;
    }

    // Validate refresh rate
    const refreshRateError = validateRefreshRate(newRefreshRate);
    if (refreshRateError) {
      setError(refreshRateError);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Validate the Drive link first
      const validationResult = await validateUrl(newLink, 'drive');
      
      if (!validationResult.isAccessible) {
        setError(validationResult.error || 'Google Drive link is not accessible');
        setValidationWarning(`
          To fix this:
          1. Check if the link format is correct
          2. Ensure you're using a direct Google Drive sharing link
          3. Make sure you have access to the file/folder
        `);
        return;
      }

      if (!validationResult.details?.isGoogleDriveViewable) {
        setValidationWarning(`
          This Google Drive link is currently private. You can still add it, but to make it accessible:
          1. Open the file/folder in Google Drive
          2. Click the "Share" button (usually in the top-right)
          3. Click "Change to anyone with the link"
          4. Set access to "Viewer" or "Commenter" as needed
          5. Click "Done" to save the changes
        `);
      }

      // Add additional warnings based on validation details
      if (validationResult.details?.serverInfo?.headers) {
        const contentType = validationResult.details.serverInfo.headers['content-type']?.toLowerCase() || '';
        const warnings: string[] = [];

        if (contentType.includes('application/vnd.google-apps.folder')) {
          warnings.push(`
            This is a Google Drive folder. Please ensure:
            1. All files within the folder are also shared
            2. The folder permissions are properly set
            3. Consider sharing specific files instead if not all content is relevant
          `);
        } else if (!contentType.includes('text/') && 
                  !contentType.includes('application/pdf') && 
                  !contentType.includes('application/vnd.google-apps.document')) {
          warnings.push(`
            This file type may not be suitable for AI processing.
            Consider sharing documents, spreadsheets, or PDFs instead.
          `);
        }

        if (warnings.length > 0) {
          setValidationWarning((prev) => 
            prev ? `${prev}\n\n${warnings.join('\n')}` : warnings.join('\n')
          );
        }
      }
      
      console.log("Submitting Drive link:", newLink, newRefreshRate);
      await onAdd({
        link: newLink,
        refresh_rate: newRefreshRate,
      });
      
      setNewLink("");
      setNewRefreshRate(30);
      setShowNewForm(false);
    } catch (error) {
      console.error("Error adding Drive link:", error);
      setError(error instanceof Error ? error.message : "Failed to add Drive link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Error deleting Drive link:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {driveLinks.length > 0 ? (
        <div className="space-y-2">
          {driveLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm">{link.link}</span>
                  {link.access_status === 'restricted' && (
                    <Lock className="h-4 w-4 text-amber-500" />
                  )}
                  {link.access_status === 'public' && (
                    <Globe className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {link.access_status === 'restricted' && (
                  <p className="text-xs text-amber-600 mt-1">
                    To make this link accessible:
                    1. Open in Drive
                    2. Click "Share"
                    3. Change to "Anyone with the link"
                  </p>
                )}
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
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
                {validationWarning && (
                  <div className="mt-2 text-sm whitespace-pre-line">
                    {validationWarning}
                  </div>
                )}
              </Alert>
            )}
            
            {!error && validationWarning && (
              <Alert variant="warning" className="border-amber-300 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Access Warning</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <div className="whitespace-pre-line">{validationWarning}</div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="drive-link">Google Drive Link</Label>
              <Input
                id="drive-link"
                type="url"
                placeholder="https://drive.google.com/..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                required
                disabled={isSubmitting || isValidating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refresh-rate">Refresh Rate (days)</Label>
              <Input
                id="refresh-rate"
                type="number"
                min="1"
                value={newRefreshRate}
                onChange={(e) => setNewRefreshRate(parseInt(e.target.value))}
                required
                disabled={isSubmitting || isValidating}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isValidating}
              className="w-full"
            >
              {(isSubmitting || isValidating) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isValidating ? 'Validating Link...' : isSubmitting ? 'Adding Link...' : 'Add Link'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
