
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { DriveLink } from "@/types/client";

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newLink) return;
    
    try {
      setIsSubmitting(true);
      await onAdd({
        link: newLink,
        refresh_rate: newRefreshRate,
      });
      
      setNewLink("");
      setNewRefreshRate(30);
      setShowNewForm(false);
    } catch (error) {
      console.error("Error adding link:", error);
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
      {driveLinks.map((link) => (
        <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="flex-1 truncate text-sm">{link.link}</span>
          <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(link.id)}
            disabled={isDeleteLoading || deletingId === link.id}
          >
            {(isDeleteLoading && deletingId === link.id) ? (
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
          <Plus className="w-4 h-4 mr-2" /> Add Google Drive Link
        </Button>
      ) : (
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="space-y-4">
            <Input
              type="url"
              placeholder="https://drive.google.com/..."
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
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
                    "Add"
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
