
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessExistingDocuments } from '@/components/admin/ProcessExistingDocuments';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useCheckAdmin } from '@/hooks/useCheckAdmin';
import { Loader2 } from 'lucide-react';

export default function DocumentExtractionPage() {
  const { isAdmin, isLoading: isCheckingAdmin } = useCheckAdmin();
  const navigate = useNavigate();
  const [clients, setClients] = useState<{ id: string; name: string; agent_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (!isCheckingAdmin && !isAdmin) {
      navigate('/auth');
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_name, agent_name')
          .order('client_name', { ascending: true });

        if (error) {
          console.error('Error fetching clients:', error);
          return;
        }

        setClients(
          data.map((client) => ({
            id: client.id,
            name: client.client_name,
            agent_name: client.agent_name || 'AI Assistant',
          }))
        );
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  if (isCheckingAdmin || (isAdmin && isLoading)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null; // Redirecting to auth page
  }

  return (
    <AdminLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Document Extraction</h1>
        <div className="grid grid-cols-1 gap-6">
          <ProcessExistingDocuments clients={clients} />
        </div>
      </div>
    </AdminLayout>
  );
}
