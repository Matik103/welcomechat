import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientListTable } from '@/components/client/ClientListTable';
import { ClientSearchBar } from '@/components/client/ClientSearchBar';
import { Button } from '@/components/ui/button';
import { Client } from '@/types/client';
import { Loader2, Plus } from 'lucide-react';
import { execSql } from '@/utils/rpcUtils';
import { toast } from 'sonner';
import { DeleteClientDialog } from '@/components/client/DeleteClientDialog';
import { supabase } from '@/integrations/supabase/client';

export default function ClientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      try {
        console.log("Fetching clients from ai_agents table...");
        
        const { data: agentsData, error: supabaseError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('interaction_type', 'config')
          .not('status', 'eq', 'deleted')
          .order('created_at', { ascending: false });
        
        if (supabaseError) {
          console.error("Supabase query error:", supabaseError);
          throw supabaseError;
        }
        
        console.log(`Fetched ${agentsData?.length || 0} clients from ai_agents:`, agentsData);
        
        if (!agentsData || !Array.isArray(agentsData) || agentsData.length === 0) {
          console.log("No clients found in ai_agents table");
          return [];
        }
        
        const clientMap = new Map<string, any>();
        
        agentsData.forEach(record => {
          const clientId = record.client_id || record.id;
          
          if (!clientMap.has(clientId) || 
              new Date(record.created_at) > new Date(clientMap.get(clientId).created_at)) {
            clientMap.set(clientId, record);
          }
        });
        
        const uniqueClients = Array.from(clientMap.values());
        console.log(`Processed ${uniqueClients.length} unique clients`);
        
        const mappedClients = uniqueClients.map((record: any) => {
          const settings = typeof record.settings === 'object' ? record.settings : {};
          const clientName = settings.client_name || record.client_name || record.name || 'Unnamed Client';
          const email = settings.email || record.email || '';
          
          const client: Client = {
            id: record.client_id || record.id,
            client_name: clientName,
            email: email, 
            agent_name: record.name || '',
            description: record.agent_description || '',
            widget_settings: settings,
            created_at: record.created_at || '',
            updated_at: record.updated_at || '',
            last_active: record.last_active || null,
            status: record.status || 'active',
            logo_url: record.logo_url || '',
            logo_storage_path: record.logo_storage_path || '',
            is_error: record.is_error || false,
            error_message: record.error_message || ''
          };
          
          console.log(`Client ${clientName}: id=${client.id}`);
          
          return client;
        });
        
        console.log("Total mapped clients:", mappedClients.length);
        return mappedClients;
      } catch (err) {
        console.error('Error fetching clients:', err);
        toast.error('Failed to load clients');
        return [];
      }
    },
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (clients && clients.length > 0) {
      console.log(`Filtering ${clients.length} clients with search query: "${searchQuery}"`);
      const filtered = clients.filter(client => {
        const searchLower = searchQuery.toLowerCase();
        return (
          client.client_name?.toLowerCase().includes(searchLower) ||
          client.agent_name?.toLowerCase().includes(searchLower) ||
          client.description?.toLowerCase().includes(searchLower) ||
          client.status?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          (client.id && client.id.toLowerCase().includes(searchLower))
        );
      });
      setFilteredClients(filtered);
    } else {
      console.log("No clients to filter");
      setFilteredClients([]);
    }
  }, [clients, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleClientsUpdated = () => {
    refetch();
  };

  const handleAddClientClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Client creation temporarily disabled for maintenance");
    console.log("Add client button clicked - functionality temporarily disabled");
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <PageHeading>
          Client Management
          <p className="text-sm font-normal text-muted-foreground">
            Error loading clients
          </p>
        </PageHeading>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          Failed to load clients. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeading>
          Client Management
          <p className="text-sm font-normal text-muted-foreground">
            View and manage all your clients
          </p>
        </PageHeading>
        <div className="flex gap-2">
          <Button className="flex items-center gap-2" onClick={handleAddClientClick}>
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>
      </div>

      <ClientSearchBar 
        onSearch={handleSearch} 
        className="mb-6" 
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClientListTable 
          clients={filteredClients} 
          onDeleteClick={handleDeleteClient} 
        />
      )}

      {!isLoading && filteredClients.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? "No clients match your search. Try a different search term."
              : "You haven't added any clients yet."}
          </p>
          {!searchQuery && (
            <Button onClick={handleAddClientClick}>
              Add Your First Client
            </Button>
          )}
        </div>
      )}

      {clients && clients.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredClients.length} of {clients.length} clients
          {searchQuery && <span> (filtered by "{searchQuery}")</span>}
        </div>
      )}

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        client={selectedClient}
        onClientsUpdated={handleClientsUpdated}
      />
    </div>
  );
}
