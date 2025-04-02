
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessExistingDocuments } from '@/components/admin/ProcessExistingDocuments';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useCheckAdmin } from '@/hooks/useCheckAdmin';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  agent_name: string;
}

export default function DocumentExtractionPage() {
  const { isAdmin, isLoading: isCheckingAdmin } = useCheckAdmin();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
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
        // Using a direct SQL query through RPC instead of the clients table
        const { data: clientsData, error } = await supabase
          .from('ai_agents')
          .select('id, name, client_id, client_name')
          .eq('interaction_type', 'config')
          .is('deleted_at', null);

        if (error) {
          console.error('Error fetching clients:', error);
          return;
        }

        if (clientsData) {
          // Transform the data into the expected Client format
          const uniqueClients = new Map<string, Client>();
          
          clientsData.forEach(agent => {
            if (agent.id && !uniqueClients.has(agent.id)) {
              uniqueClients.set(agent.id, {
                id: agent.id,
                name: agent.client_name || agent.name || 'Unnamed Client',
                agent_name: agent.name || 'AI Assistant'
              });
            }
          });
          
          setClients(Array.from(uniqueClients.values()));
        }
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
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            The document processing functionality is currently being rebuilt. 
            Basic file uploads are still available, but advanced document extraction 
            features will return in a future update.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The document extraction service is being rebuilt with improved functionality.
                You can still upload documents in the client management section, but advanced
                processing features are temporarily unavailable.
              </p>
              
              <p className="text-sm text-muted-foreground">
                Check back soon for the updated document processing capabilities.
              </p>
            </CardContent>
          </Card>
          
          <ProcessExistingDocuments clients={clients} />
        </div>
      </div>
    </AdminLayout>
  );
}
