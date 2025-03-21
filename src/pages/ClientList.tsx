
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

export default function ClientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Query to fetch client data from ai_agents table where interaction_type = 'config'
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      try {
        console.log("Fetching clients from ai_agents table...");
        const query = `
          SELECT 
            id, 
            client_id,
            name as agent_name,
            agent_description as description,
            settings,
            created_at, 
            updated_at, 
            last_active,
            status,
            logo_url,
            logo_storage_path,
            is_error,
            error_message
          FROM ai_agents 
          WHERE interaction_type = 'config'
          ORDER BY created_at DESC
        `;
        
        const results = await execSql(query);
        
        console.log(`Fetched ${results?.length || 0} clients from ai_agents:`, results);
        
        if (!results || !Array.isArray(results)) {
          return [];
        }
        
        // Map the results to the Client interface
        return results.map((record: any) => {
          // Extract client name from settings if available
          const settings = typeof record.settings === 'object' ? record.settings : {};
          const clientName = settings.client_name || 'Unnamed Client';
          
          return {
            id: record.id,
            client_id: record.client_id || record.id,
            client_name: clientName,
            agent_name: record.agent_name || '',
            description: record.description || '',
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
        });
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
    if (clients) {
      console.log(`Filtering ${clients.length} clients with search query: "${searchQuery}"`);
      const filtered = clients.filter(client => {
        const searchLower = searchQuery.toLowerCase();
        return (
          client.client_name?.toLowerCase().includes(searchLower) ||
          client.agent_name?.toLowerCase().includes(searchLower) ||
          client.description?.toLowerCase().includes(searchLower) ||
          client.status?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredClients(filtered);
    }
  }, [clients, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleDeleteClient = (client: Client) => {
    // This is a placeholder for future delete functionality
    console.log("Delete client clicked:", client);
    toast.info("Delete functionality will be implemented in a future update");
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
          <Link to="/admin/clients/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </Link>
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
            <Link to="/admin/clients/new">
              <Button>Add Your First Client</Button>
            </Link>
          )}
        </div>
      )}

      {clients && clients.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredClients.length} of {clients.length} clients
          {searchQuery && <span> (filtered by "{searchQuery}")</span>}
        </div>
      )}
    </div>
  );
}
