
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

  // Enhanced query to fetch comprehensive client information from ai_agents table
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      try {
        console.log("Fetching comprehensive client data from ai_agents table...");
        // Expanded query to get more client details
        const query = `
          SELECT 
            id, 
            client_id,
            client_name, 
            email, 
            logo_url, 
            logo_storage_path,
            created_at, 
            updated_at, 
            last_active,
            deleted_at,
            deletion_scheduled_at,
            status,
            settings,
            name,
            agent_description,
            interaction_type,
            response_time_ms,
            is_error,
            error_type,
            error_message
          FROM ai_agents 
          WHERE interaction_type = 'config'
          ORDER BY created_at DESC
        `;
        
        const results = await execSql(query);
        
        if (!results || !Array.isArray(results)) {
          console.error('Invalid results from SQL query:', results);
          return [];
        }
        
        console.log(`Found ${results.length} clients in ai_agents table:`, results);
        
        // Enhanced mapping with more comprehensive client information
        return results.map((record: any) => {
          // Core client properties
          const id = record.client_id || record.id || '';
          const clientName = record.client_name || '';
          const email = record.email || '';
          const logoUrl = record.logo_url || '';
          const logoStoragePath = record.logo_storage_path || '';
          const createdAt = record.created_at || '';
          const updatedAt = record.updated_at || '';
          const lastActive = record.last_active || null;
          const deletionScheduledAt = record.deletion_scheduled_at || null;
          const deletedAt = record.deleted_at || null;
          const status = record.status || 'active';
          
          // Agent-specific properties
          const settings = typeof record.settings === 'object' ? record.settings : {};
          const agentDescription = record.agent_description || '';
          const name = record.name || '';
          const agentName = name || "";
          
          // Error information if available
          const isError = record.is_error || false;
          const errorType = record.error_type || '';
          const errorMessage = record.error_message || '';
          
          // Performance metrics
          const responseTimeMs = record.response_time_ms || 0;
          
          // Get widget settings from the settings object or create empty one
          const widgetSettings = typeof settings === 'object' ? settings : {};
          
          return {
            id,
            client_name: clientName,
            email,
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath,
            created_at: createdAt,
            updated_at: updatedAt,
            last_active: lastActive,
            deletion_scheduled_at: deletionScheduledAt,
            deleted_at: deletedAt,
            status,
            widget_settings: widgetSettings,
            description: agentDescription,
            name,
            agent_name: agentName,
            is_error: isError,
            error_type: errorType,
            error_message: errorMessage,
            response_time_ms: responseTimeMs
          };
        });
      } catch (err) {
        console.error('Error fetching clients:', err);
        toast.error('Failed to load clients');
        return [];
      }
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (clients) {
      console.log(`Filtering ${clients.length} clients with search query: "${searchQuery}"`);
      // Enhanced filter to include more client properties
      const filtered = clients.filter(client => {
        const searchLower = searchQuery.toLowerCase();
        return (
          client.client_name?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.agent_name?.toLowerCase().includes(searchLower) ||
          client.description?.toLowerCase().includes(searchLower) ||
          client.status?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredClients(filtered);
      console.log(`Found ${filtered.length} clients matching search criteria`);
    }
  }, [clients, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
            View and manage all your clients with comprehensive information
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
          onDeleteClick={(client) => {}} 
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
