import React, { useEffect, useState } from 'react';
import { getAllAgents, Agent } from '@/services/agentService';
import { Card } from '@/components/ui/card';
import { BarChart } from '@/components/ui/BarChart';

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await getAllAgents();
        setAgents(data);
      } catch (err) {
        setError('Failed to fetch agents');
        console.error('Error fetching agents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Agents</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{agent.name}</h2>
              <span className={`px-2 py-1 rounded-full text-sm ${
                agent.status === 'active' ? 'bg-green-100 text-green-800' :
                agent.status === 'inactive' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {agent.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-600">Client: {agent.client_name}</p>
              <p className="text-gray-600">Total Interactions: {agent.total_interactions}</p>
              <p className="text-gray-600">Avg Response Time: {agent.average_response_time.toFixed(2)}s</p>
              <p className="text-gray-600">Last Active: {new Date(agent.last_active).toLocaleString()}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h3>
              <BarChart
                data={[
                  { name: 'Interactions', value: agent.total_interactions },
                  { name: 'Response Time', value: agent.average_response_time * 1000 }
                ]}
                color="#4F46E5"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Agents; 