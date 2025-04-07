
import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Agent } from '@/services/agentService';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BarChart } from '@/components/ui/BarChart';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        
        // Fetch agents from the ai_agents table with config interaction_type
        // Exclude agents with deleted status
        const { data: agentsData, error: agentsError } = await supabase
          .from('ai_agents')
          .select(`
            id,
            name,
            client_id,
            client_name,
            agent_description,
            status,
            last_active,
            response_time_ms
          `)
          .eq('interaction_type', 'config')
          .eq('status', 'active')  // Only show active agents
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
        
        if (agentsError) throw agentsError;

        // Get total count for pagination (only for active agents)
        const { count, error: countError } = await supabase
          .from('ai_agents')
          .select('id', { count: 'exact', head: true })
          .eq('interaction_type', 'config')
          .eq('status', 'active')  // Only count active agents
          .is('deleted_at', null);
        
        if (countError) throw countError;
        
        // Transform the data to include calculated statistics
        const enhancedAgents = await Promise.all(
          (agentsData || []).map(async (agent) => {
            // Get total interactions for this agent
            const { count: totalInteractions } = await supabase
              .from('ai_agents')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', agent.client_id)
              .eq('name', agent.name)
              .eq('interaction_type', 'chat_interaction');

            // Get average response time
            const { data: responseTimes } = await supabase
              .from('ai_agents')
              .select('response_time_ms')
              .eq('client_id', agent.client_id)
              .eq('name', agent.name)
              .eq('interaction_type', 'chat_interaction')
              .not('response_time_ms', 'is', null);

            const avgResponseTime = responseTimes && responseTimes.length > 0
              ? responseTimes.reduce((sum, rt) => sum + (rt.response_time_ms || 0), 0) / responseTimes.length
              : 0;

            return {
              ...agent,
              total_interactions: totalInteractions || 0,
              average_response_time: avgResponseTime / 1000 // Convert to seconds
            };
          })
        );

        setAgents(enhancedAgents);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Manage Agents</h1>
        
        {agents.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center text-gray-500">
            No active agents found
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm border rounded-lg overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Interactions</TableHead>
                    <TableHead>Avg Response Time</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.client_name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {agent.agent_description ? (
                          <span className="text-sm text-gray-600">
                            {agent.agent_description.substring(0, 60)}
                            {agent.agent_description.length > 60 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-700 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        >
                          active
                        </Badge>
                      </TableCell>
                      <TableCell>{agent.total_interactions.toLocaleString()}</TableCell>
                      <TableCell>{agent.average_response_time.toFixed(2)}s</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {agent.last_active 
                          ? format(new Date(agent.last_active), 'MMM d, yyyy')
                          : 'Never'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && handlePageChange(page - 1)}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        isActive={page === i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < totalPages && handlePageChange(page + 1)}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
