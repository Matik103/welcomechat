
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateAgentDialog } from '@/components/agents/CreateAgentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agent } from '@/types/agent';
import { AgentCard } from '@/components/agents/AgentCard';

const ClientAgents: React.FC = () => {
  const { user, clientId } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [clientName, setClientName] = useState<string>('');

  const fetchAgents = async () => {
    try {
      setLoading(true);
      console.log('Fetching agents for client ID:', clientId);
      
      if (!clientId) {
        console.error('No client ID available');
        setError('No client ID available');
        setLoading(false);
        return;
      }

      // First get the client name
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_name')
        .eq('id', clientId)
        .single();

      if (clientError && clientError.code !== 'PGRST116') {
        console.error('Error fetching client name:', clientError);
      } else if (clientData) {
        console.log('Found client name:', clientData.client_name);
        setClientName(clientData.client_name || '');
      }

      // Then get all agents for this client
      console.log('Querying ai_agents table for client_id:', clientId);
      const { data, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('interaction_type', 'config')
        .eq('status', 'active');

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        throw agentsError;
      }

      console.log(`Fetched ${data?.length || 0} agents:`, data);
      
      if (!data || data.length === 0) {
        console.log('No agents found for client ID:', clientId);
        setAgents([]);
      } else {
        const formattedAgents: Agent[] = (data || []).map(agent => ({
          id: agent.id,
          client_id: agent.client_id || '',
          client_name: agent.client_name || clientName,
          name: agent.name,
          description: agent.description || '',
          status: agent.status || 'active',
          created_at: agent.created_at || new Date().toISOString(),
          updated_at: agent.updated_at || new Date().toISOString(),
          interaction_type: agent.interaction_type || 'config',
          agent_description: agent.agent_description || '',
          logo_url: agent.logo_url || '',
          logo_storage_path: agent.logo_storage_path || '',
          settings: agent.settings || {},
          openai_assistant_id: agent.openai_assistant_id || '',
          deepseek_assistant_id: agent.deepseek_assistant_id || '',
          total_interactions: 0,
          average_response_time: 0,
          last_active: agent.updated_at || new Date().toISOString()
        }));

        setAgents(formattedAgents);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      console.log('Client ID detected, fetching agents:', clientId);
      fetchAgents();

      // Subscribe to changes in the ai_agents table for this client
      const subscription = supabase
        .channel('ai_agents_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_agents',
            filter: `client_id=eq.${clientId}`,
          },
          (payload) => {
            console.log('Received real-time update:', payload);
            fetchAgents();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      console.log('No client ID available, cannot fetch agents');
      setLoading(false);
      setError('No client ID available');
    }
  }, [clientId]);

  const handleAgentCreated = async (agent: Agent) => {
    console.log('Agent created, refreshing agent list:', agent);
    await fetchAgents();
    toast.success('Agent created successfully!');
  };

  console.log('Current agents state:', agents);
  console.log('Loading state:', loading);
  console.log('Error state:', error);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">AI Agents</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <Skeleton className="h-10 w-full rounded-md" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI assistants for {clientName}
          </p>
        </div>
        <Button onClick={() => setIsAgentDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Agent
        </Button>
      </div>

      <CreateAgentDialog
        open={isAgentDialogOpen}
        onOpenChange={setIsAgentDialogOpen}
        clientId={clientId || undefined}
        clientName={clientName}
        onAgentCreated={handleAgentCreated}
      />

      {agents.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI agents found</h3>
          <p className="text-gray-500 mb-6">
            Create your first AI agent to start providing automated assistance to your users.
          </p>
          <Button onClick={() => setIsAgentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent}
              onRefresh={fetchAgents}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientAgents;
