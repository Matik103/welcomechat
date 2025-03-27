
import { Eye, MessageSquare, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ClientActionsProps {
  clientId: string;
  onDeleteClick: () => void;
}

export const ClientActions = ({ clientId, onDeleteClick }: ClientActionsProps) => {
  if (!clientId) {
    console.error("Missing client ID in ClientActions", clientId);
    toast.error("Missing client ID for actions");
    
    // Return disabled actions when clientId is missing
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="p-1 text-gray-300 cursor-not-allowed" title="View Agent (ID missing)">
          <Eye className="w-4 h-4" />
        </span>
        <span className="p-1 text-gray-300 cursor-not-allowed" title="Widget Settings (ID missing)">
          <MessageSquare className="w-4 h-4" />
        </span>
        <span className="p-1 text-gray-300 cursor-not-allowed" title="Edit Info (ID missing)">
          <Edit className="w-4 h-4" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        to={`/admin/clients/view/${clientId}`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="View Agent"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <Link
        to={`/admin/clients/${clientId}/widget-settings`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Widget Settings"
      >
        <MessageSquare className="w-4 h-4" />
      </Link>
      <Link
        to={`/admin/clients/${clientId}/edit-info`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Edit Info"
      >
        <Edit className="w-4 h-4" />
      </Link>
    </div>
  );
}
