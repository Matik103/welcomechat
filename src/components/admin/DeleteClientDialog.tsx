import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { logActivity } from '@/utils/activity';
import type { Client } from '@/types/supabase';

interface DeleteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onDeleted: () => void;
}

export default function DeleteClientDialog({
  isOpen,
  onClose,
  client,
  onDeleted,
}: DeleteClientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // First delete the AI agent if it exists
      if (client.ai_agents?.[0]?.id) {
        const { error: agentError } = await supabase
          .from('ai_agents')
          .delete()
          .eq('id', client.ai_agents[0].id);

        if (agentError) throw agentError;

        await logActivity(
          'delete',
          'ai_agent',
          client.ai_agents[0].id,
          `AI Agent "${client.ai_agents[0].agent_name}" was deleted`,
          { client_name: client.name },
          client.id
        );
      }

      // Then delete the client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (clientError) throw clientError;

      await logActivity(
        'delete',
        'client',
        client.id,
        `Client "${client.name}" was deleted`,
        { email: client.email }
      );

      toast.success('Client deleted successfully');
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            Delete Client
          </Dialog.Title>

          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete {client.name}? This action cannot be
              undone. All associated AI agent data will also be deleted.
            </p>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 