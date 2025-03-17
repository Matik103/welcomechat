
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { WebsiteUrl } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useUrlAccessCheck } from "@/hooks/useUrlAccessCheck";

interface WebsiteUrlsProps {
  urls: WebsiteUrl[];
  onAdd: (data: { url: string; refresh_rate: number }) => Promise<void>;
  onDelete: (id: number) => void;
  isAddLoading: boolean;
  isDeleteLoading: boolean;
}

export const WebsiteUrls = ({
  urls,
  onAdd,
  onDelete,
  isAddLoading,
  isDeleteLoading,
}: WebsiteUrlsProps) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newRefreshRate, setNewRefreshRate] = useState(30);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkUrlAccess, isChecking, lastResult } = useUrlAccessCheck();
  const [isValidated, setIsValidated] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUrl(e.target.value);
    // Reset validation when URL changes
    setIsValidated(false);
    setError(null);
  };

  const validateUrl = async () => {
    if (!newUrl) {
      setError("Please enter a URL");
      return false;
    }

    try {
      // Basic URL validation
      new URL(newUrl);
    } catch (e) {
      setError("Please enter a valid URL");
      return false;
    }

    try {
      const result = await checkUrlAccess(newUrl);
      
      if (!result.isAccessible) {
        setError(`URL is not accessible: ${result.error || "Unknown error"}`);
        return false;
      }
      
      if (result.hasScrapingRestrictions) {
        setError("This website has crawling restrictions in its robots.txt file. Your AI agent may have limited access to its content.");
        // Still allow it but with a warning
      }
      
      setIsValidated(true);
      return true;
    } catch (e) {
      setError("Failed to validate URL");
      return false;
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleAdd called with URL:", newUrl);
    setError(null);
    
    if (!isValidated) {
      const isValid = await validateUrl();
      if (!isValid) return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting website URL:", newUrl, newRefreshRate);
      await onAdd({
        url: newUrl,
        refresh_rate: newRefreshRate,
      });
      
      setNewUrl("");
      setNewRefreshRate(30);
      setShowNewForm(false);
      setIsValidated(false);
    } catch (error) {
      console.error("Error adding URL:", error);
      setError(error instanceof Error ? error.message : "Failed to add URL");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Error deleting URL:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {urls.length > 0 ? (
        <div className="space-y-2">
          {urls.map((url) => (
            <div key={url.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              <span className="flex-1 truncate text-sm">{url.url}</span>
              <span className="text-sm text-gray-500 whitespace-nowrap">({url.refresh_rate} days)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(url.id)}
                disabled={isDeleteLoading || deletingId === url.id}
                className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {(isDeleteLoading && deletingId === url.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">No website URLs added yet.</div>
      )}

      {!showNewForm ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewForm(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Website URL
        </Button>
      ) : (
        <form className="border border-gray-200 rounded-md p-4 bg-gray-50" onSubmit={handleAdd}>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isValidated && !error && (
              <Alert variant="success" className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">URL Validated</AlertTitle>
                <AlertDescription className="text-green-700">
                  This website is accessible and can be added to your sources.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={handleUrlChange}
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={validateUrl}
                  disabled={isChecking || !newUrl || isValidated}
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
                onChange={(e) => setNewRefreshRate(parseInt(e.target.value))}
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
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isAddLoading || isSubmitting || !newUrl || (isChecking && !isValidated)}
              >
                {(isAddLoading || isSubmitting) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add URL
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
