import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { WebsiteUrl } from "@/types/client";

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newUrl) return;
    
    try {
      setIsSubmitting(true);
      await onAdd({
        url: newUrl,
        refresh_rate: newRefreshRate,
      });
      
      setNewUrl("");
      setNewRefreshRate(30);
      setShowNewForm(false);
    } catch (error) {
      console.error("Error adding URL:", error);
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
      {urls.map((url) => (
        <div key={url.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="flex-1 truncate text-sm">{url.url}</span>
          <span className="text-sm text-gray-500 whitespace-nowrap">({url.refresh_rate} days)</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(url.id)}
            disabled={isDeleteLoading || deletingId === url.id}
          >
            {(isDeleteLoading && deletingId === url.id) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      ))}

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
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="space-y-4">
            <Input
              type="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Rate (days)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newRefreshRate}
                  onChange={(e) => setNewRefreshRate(parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Button 
                  onClick={handleAdd}
                  disabled={isAddLoading || isSubmitting}
                >
                  {(isAddLoading || isSubmitting) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
