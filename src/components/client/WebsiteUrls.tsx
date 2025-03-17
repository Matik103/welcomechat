import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { WebsiteUrl } from "@/types/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useUrlValidation } from "@/hooks/useUrlValidation";

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
    console.log("handleAdd called with URL:", newUrl);
    setError(null);
    setValidationWarning(null);
    
    if (!newUrl) {
      setError("Please enter a URL");
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
      
      // Validate the URL first
      const validationResult = await validateUrl(newUrl, 'website');
      
      if (!validationResult.isAccessible) {
        setError(validationResult.error || 'Website is not accessible');
        setValidationWarning(`
          To fix this:
          1. Check if the website is online and accessible
          2. Ensure you have the correct URL
          3. Check if the website requires authentication
        `);
        return;
      }

      if (validationResult.details?.robotsTxtAllows === false) {
        setValidationWarning(`
          This website currently blocks scraping. You can still add it, but to enable scraping:
          1. Contact the website administrator
          2. Request permission to scrape the content
          3. Ask them to update their robots.txt file to allow your bot
          4. Alternatively, look for an official API if available
        `);
      }

      // Add additional warnings based on validation details
      if (validationResult.details) {
        const warnings: string[] = [];
        
        if (!validationResult.details.isSecure) {
          warnings.push(`
            This website does not use HTTPS. To ensure security:
            1. Check if an HTTPS version is available
            2. Contact the website administrator
            3. Consider using a different source
          `);
        }

        const contentType = validationResult.details.contentType?.toLowerCase() || '';
        if (!contentType.includes('text/html') && 
            !contentType.includes('application/json') && 
            !contentType.includes('text/plain')) {
          warnings.push(`
            This content type (${contentType}) may not be suitable for scraping.
            Consider finding an alternative source with HTML or JSON content.
          `);
        }

        if (warnings.length > 0) {
          setValidationWarning((prev) => 
            prev ? `${prev}\n\n${warnings.join('\n')}` : warnings.join('\n')
          );
        }
      }
      
      console.log("Submitting website URL:", newUrl, newRefreshRate);
      await onAdd({
        url: newUrl,
        refresh_rate: newRefreshRate,
      });
      
      setNewUrl("");
      setNewRefreshRate(30);
      setShowNewForm(false);
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
              <Label htmlFor="website-url">Website URL</Label>
              <Input
                id="website-url"
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
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
              {isValidating ? 'Validating URL...' : isSubmitting ? 'Adding URL...' : 'Add URL'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
