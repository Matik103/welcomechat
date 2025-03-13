import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiBarChart2, FiDatabase } from 'react-icons/fi';
import DeleteClientDialog from './DeleteClientDialog';

interface Client {
  id: string;
  name: string;
  ai_agents: {
    id: string;
    agent_name: string;
  }[];
}

interface ClientActionsProps {
  client: Client;
  onClientDeleted: () => void;
}

export default function ClientActions({ client, onClientDeleted }: ClientActionsProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = () => {
    navigate(`/admin/clients/${client.id}/edit`);
  };

  const handleViewStats = (agentId: string) => {
    navigate(`/admin/agents/${agentId}/stats`);
  };

  const handleManageKnowledge = (agentId: string) => {
    navigate(`/admin/agents/${agentId}/knowledge`);
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-900 transition-colors"
          title="Edit Client"
        >
          <FiEdit2 className="w-5 h-5" />
        </button>
        {client.ai_agents?.[0]?.id && (
          <>
            <button
              onClick={() => handleViewStats(client.ai_agents[0].id)}
              className="text-green-600 hover:text-green-900 transition-colors"
              title="View AI Agent Stats"
            >
              <FiBarChart2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleManageKnowledge(client.ai_agents[0].id)}
              className="text-purple-600 hover:text-purple-900 transition-colors"
              title="Manage Knowledge Base"
            >
              <FiDatabase className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-red-600 hover:text-red-900 transition-colors"
          title="Delete Client"
        >
          <FiTrash2 className="w-5 h-5" />
        </button>
      </div>

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        client={client}
        onDeleted={onClientDeleted}
      />
    </>
  );
} 