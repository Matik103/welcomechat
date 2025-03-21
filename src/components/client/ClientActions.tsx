
import { Eye, MessageSquare, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ClientActionsProps {
  clientId: string;
  onDeleteClick: () => void;
}

export const ClientActions = ({ clientId, onDeleteClick }: ClientActionsProps) => {
  // Add a check to ensure clientId is defined before using it
  if (!clientId) {
    console.error("ClientActions: clientId is undefined");
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          className="p-1 text-gray-400 cursor-not-allowed opacity-50"
          title="View Client"
          disabled
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          className="p-1 text-gray-400 cursor-not-allowed opacity-50"
          title="Widget Settings"
          disabled
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          className="p-1 text-gray-400 cursor-not-allowed opacity-50"
          title="Edit Info"
          disabled
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDeleteClick}
          className="p-1 text-gray-400 cursor-not-allowed opacity-50"
          title="Schedule Deletion"
          aria-label="Schedule client deletion"
          disabled
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        to={`/admin/clients/view/${clientId}`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="View Client"
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
      <button
        onClick={onDeleteClick}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Schedule Deletion"
        aria-label="Schedule client deletion"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
