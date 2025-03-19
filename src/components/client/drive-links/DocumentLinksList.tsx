
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { DocumentLink } from "@/types/client";

interface DocumentLinksListProps {
  links: DocumentLink[];
  onDelete: (id: number) => void;
  isDeleteLoading: boolean;
  deletingId: number | null;
}

export const DocumentLinksList = ({
  links,
  onDelete,
  isDeleteLoading,
  deletingId,
}: DocumentLinksListProps) => {
  if (links.length === 0) {
    return <div className="text-sm text-gray-500 italic">No document links added yet.</div>;
  }

  const getDocumentTypeLabel = (type?: string) => {
    if (!type) return "";
    
    switch (type) {
      case "google_drive": return "Google Drive";
      case "google_doc": return "Google Doc";
      case "excel": return "Excel";
      case "pdf": return "PDF";
      case "other": return "Other";
      default: return type;
    }
  };

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div 
          key={link.id} 
          className="flex items-center gap-2 p-3 rounded-md border bg-gray-50 border-gray-200"
        >
          <div className="flex-1 truncate text-sm">
            {link.link}
          </div>
          {link.document_type && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {getDocumentTypeLabel(link.document_type)}
            </span>
          )}
          <span className="text-sm text-gray-500 whitespace-nowrap">({link.refresh_rate} days)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(link.id)}
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
  );
};
