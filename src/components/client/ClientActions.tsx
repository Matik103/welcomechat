
import { Eye, MessageSquare, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ClientActionsProps {
  clientId: string;
  onDeleteClick: () => void;
}

export const ClientActions = ({ clientId, onDeleteClick }: ClientActionsProps) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        to={`/clients/${clientId}`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <Link
        to={`/clients/${clientId}/widget-settings`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Widget Settings"
      >
        <MessageSquare className="w-4 h-4" />
      </Link>
      <Link
        to={`/clients/${clientId}/edit`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={onDeleteClick}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
