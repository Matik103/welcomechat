
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { DriveLink } from "@/types/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleAdd called with link:", newLink);
    setError(null);
    
    if (!newLink) {
      setError("Please enter a Google Drive link");
      return;
    }
    
    // Basic validation for Google Drive links
    if (!newLink.includes('drive.google.com')) {
      setError("Please enter a valid Google Drive link");
      return;
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

  return (
    <div className="space-y-4">
      {driveLinks.length > 0 ? (
        <div className="space-y-2">
          {driveLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              <span className="flex-1 truncate text-sm">{link.link}</span>
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
              />
            </div>
            
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowNewForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isAddLoading || isSubmitting || !newLink}
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
