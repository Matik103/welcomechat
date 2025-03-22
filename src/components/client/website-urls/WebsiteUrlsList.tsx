
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { WebsiteUrl } from "@/types/client";

interface WebsiteUrlsListProps {
  websiteUrls: WebsiteUrl[];
  onDelete: (url: WebsiteUrl) => void;
  onStatusUpdate?: (id: number, status: WebsiteUrl['status']) => void;
  isLoading: boolean;
  isClientView?: boolean;
}

export const WebsiteUrlsList = ({
  websiteUrls,
  onDelete,
  onStatusUpdate,
  isLoading,
  isClientView = false,
}: WebsiteUrlsListProps) => {
  if (websiteUrls.length === 0) {
    return <div className="text-sm text-gray-500 italic">No website URLs added yet.</div>;
  }

  return (
    <div className="space-y-2">
      {websiteUrls.map((url) => (
        <div key={url.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="flex-1 truncate text-sm">{url.url}</span>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            ({url.status || 'pending'})
          </span>
          {!isClientView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(url)}
              disabled={isLoading}
              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
