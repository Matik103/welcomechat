
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useClientData } from '@/hooks/useClientData';
import { getAllAgents } from '@/services/agentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ClientViewLoading } from '@/components/client-view/ClientViewLoading';
import { AgentCard } from '@/components/agents/AgentCard';
import { CreateAgentDialog } from '@/components/agents/CreateAgentDialog';
import { toast } from 'sonner';
import type { AgentDetails } from '@/types/agent';

export default function ClientAgents() {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client } = useClientData(clientId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch client's agents
  const { data: agents, isLoading, refetch } = useQuery({
    queryKey: ['client-agents', clientId],
    queryFn: async () => {
      try {
        const allAgents = await getAllAgents();
        // Filter agents to only show this client's agents
        return allAgents.filter(agent => agent.client_id === clientId);
      } catch (error) {
        console.error('Error fetching agents:', error);
        toast.error('Failed to load agents');
        return [];
      }
    },
    enabled: !!clientId,
  });

  // Filter agents based on search query
  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.agent_description && agent.agent_description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateAgent = async (newAgent: Partial<AgentDetails>) => {
    // This function will be called after successful agent creation
    await refetch(); // Explicitly refetch agents after creation
    setIsCreateDialogOpen(false);
  };

  if (isLoading) {
    return <ClientViewLoading />;
  }

  return (
    <div className="container py-8 mx-auto">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Agents</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your AI agents
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search agents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Agents Grid */}
        {filteredAgents && filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onRefresh={refetch}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-2">No Agents Found</CardTitle>
              <CardDescription className="text-center max-w-md mb-6">
                {searchQuery
                  ? "No agents match your search criteria. Try a different search term."
                  : "You haven't created any AI agents yet. Create your first agent to get started."}
              </CardDescription>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Your First Agent
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Agent Dialog */}
      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        clientId={clientId}
        clientName={client?.client_name || ""}
        onAgentCreated={handleCreateAgent}
      />
    </div>
  );
}
