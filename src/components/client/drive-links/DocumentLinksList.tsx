
import { DocumentLink } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, File, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  deletingId
}: DocumentLinksListProps) => {
  if (links.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500 italic">
        No document links added yet
      </div>
    );
  }

  const getIconForDocumentType = (link: DocumentLink) => {
    const isFolder = link.document_type === "google_drive_folder" || link.link.includes('/folders/');
    
    if (isFolder) {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    
    return <File className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Document Links</h3>
      
      <div className="border border-gray-200 divide-y divide-gray-200 rounded-md">
        {links.map((link) => (
          <div key={link.id} className="p-3 flex items-center justify-between bg-white">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                {getIconForDocumentType(link)}
                <a
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 font-medium text-blue-600 hover:underline truncate"
                >
                  {link.link}
                </a>
              </div>
              
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span>
                  Refresh rate: {link.refresh_rate} days
                </span>
                <span className="mx-2">•</span>
                <span>
                  Added {link.created_at ? formatDistanceToNow(new Date(link.created_at), { addSuffix: true }) : 'recently'}
                </span>
                {link.document_type && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="capitalize">
                      {link.document_type === "google_drive_folder" 
                        ? "Google Drive Folder" 
                        : link.document_type.replace(/_/g, ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => onDelete(link.id)}
              disabled={isDeleteLoading && deletingId === link.id}
            >
              {isDeleteLoading && deletingId === link.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
