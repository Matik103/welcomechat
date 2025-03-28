
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Database, Key, HardDrive, Zap, Plus, Settings } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RecentActivityList } from "@/components/dashboard/RecentActivityList";
import { useNavigate } from "react-router-dom";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { SmallStat } from "@/components/dashboard/SmallStat";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ClientActivity } from "@/types/activity";
import { BarChart } from "@/components/dashboard/BarChart";
import { NewClientModal } from "@/components/client/NewClientModal";
import { getAllAgents } from "@/services/agentService";
import { getActiveClientsCount } from "@/services/clientService";
import { getTotalInteractionsCount } from "@/services/aiInteractionService";
import { getTrainingResourcesCount } from "@/services/trainingResourcesService";
import { getAdministrationActivitiesCount } from "@/services/administrationService";

const generateRandomData = (length: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};

export default function Index() {
  const navigate = useNavigate();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [highlightedActivity, setHighlightedActivity] = useState<string | null>(null);
  const [agentData, setAgentData] = useState({ total: 0, active: 0, change: 0 });
  const [clientData, setClientData] = useState({ total: 0, active: 0, change: 0 });
  const [interactionData, setInteractionData] = useState({ total: 0, recent: 0, change: 0 });
  const [trainingData, setTrainingData] = useState({ total: 0, recent: 0, change: 0 });
  const [administrationData, setAdministrationData] = useState({ total: 0, recent: 0, change: 0 });
  
  const {
    activeUsers,
    interactionCount,
    avgResponseTime,
    commonQueries,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useAdminDashboard();
  
  const {
    activities,
    isLoading: isActivitiesLoading,
    error: activitiesError,
    refetch: refetchActivities
  } = useRecentActivities();

  const chartData = {
    database: generateRandomData(24),
    auth: generateRandomData(24),
    storage: generateRandomData(24),
    realtime: generateRandomData(24)
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents = await getAllAgents();
        const totalAgents = agents.length;

        const timeAgo = new Date();
        timeAgo.setHours(timeAgo.getHours() - 48);
        
        const activeAgents = agents.filter(agent => 
          agent.last_active && new Date(agent.last_active) > timeAgo
        ).length;
        
        const changePercentage = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) / 5 : 0;
        
        setAgentData({
          total: totalAgents,
          active: activeAgents,
          change: changePercentage
        });
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    
    const fetchClients = async () => {
      try {
        const clientStats = await getActiveClientsCount();
        
        const changePercentage = clientStats.total > 0 ? 
          Math.round((clientStats.active / clientStats.total) * 100) / 5 : 0;
        
        setClientData({
          total: clientStats.total,
          active: clientStats.active,
          change: changePercentage
        });
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    
    const fetchInteractions = async () => {
      try {
        const interactionStats = await getTotalInteractionsCount();
        
        setInteractionData({
          total: interactionStats.total,
          recent: interactionStats.recent,
          change: interactionStats.changePercentage
        });
      } catch (error) {
        console.error("Error fetching interactions:", error);
      }
    };
    
    const fetchTrainingResources = async () => {
      try {
        const trainingStats = await getTrainingResourcesCount();
        
        setTrainingData({
          total: trainingStats.total,
          recent: trainingStats.recent,
          change: trainingStats.changePercentage
        });
      } catch (error) {
        console.error("Error fetching training resources:", error);
      }
    };
    
    const fetchAdministrationActivities = async () => {
      try {
        const adminStats = await getAdministrationActivitiesCount();
        
        setAdministrationData({
          total: adminStats.total,
          recent: adminStats.recent,
          change: adminStats.changePercentage
        });
      } catch (error) {
        console.error("Error fetching administration activities:", error);
      }
    };
    
    fetchAgents();
    fetchClients();
    fetchInteractions();
    fetchTrainingResources();
    fetchAdministrationActivities();
  }, []);

  const handleActivityClick = (id: string) => {
    setHighlightedActivity(id === highlightedActivity ? null : id);
  };

  const handleClientsClick = () => {
    navigate('/admin/clients');
  };

  const handleAgentsClick = () => {
    navigate('/admin/agents');
  };

  const handleTrainingsClick = () => {
    console.log('Navigating to trainings page');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetchDashboard();
      refetchActivities();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetchDashboard, refetchActivities]);

  if (dashboardError || activitiesError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 dashboard-heading">Dashboard Error</h1>
        <p className="text-red-500 body-text">
          {dashboardError ? `Dashboard error: ${dashboardError.message}` : ''}
          {activitiesError ? `Activities error: ${activitiesError.message}` : ''}
        </p>
        <Button 
          onClick={() => {
            refetchDashboard();
            refetchActivities();
          }}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {isDashboardLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card 
              className="bg-green-50 hover:bg-green-100 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={handleClientsClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-green-900">CLIENTS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 text-green-800">{clientData.total}</div>
                <div className="text-sm text-green-700">{clientData.active} Active {clientData.change > 0 ? `+${Math.round(clientData.change)}%` : ''}</div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-100 hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={handleAgentsClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-gray-900">AGENTS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 text-gray-800">{agentData.total}</div>
                <div className="text-sm text-gray-700">{agentData.active} Active {agentData.change > 0 ? `+${Math.round(agentData.change)}%` : ''}</div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 hover:bg-yellow-100 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-yellow-900">INTERACTIONS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 text-yellow-800">{interactionData.total}</div>
                <div className="text-sm text-yellow-700">{interactionData.recent} Recent {interactionData.change > 0 ? `+${Math.round(interactionData.change)}%` : ''}</div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 hover:bg-blue-100 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-blue-900">TRAININGS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 text-blue-800">{trainingData.total}</div>
                <div className="text-sm text-blue-700">{trainingData.recent} Recent {trainingData.change > 0 ? `+${Math.round(trainingData.change)}%` : ''}</div>
              </CardContent>
            </Card>

            <Card className="bg-pink-50 hover:bg-pink-100 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-pink-900">ADMINISTRATION</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 text-pink-800">{administrationData.total}</div>
                <div className="text-sm text-pink-700">{administrationData.recent} Recent {administrationData.change > 0 ? `+${Math.round(administrationData.change)}%` : ''}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Clients</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.database} color="#22C55E" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Agents</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.auth} color="#6B7280" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-yellow-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Interactions</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.storage} color="#EAB308" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Trainings</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.realtime} color="#3B82F6" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-pink-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900">Administration</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[80px] w-full">
                  <BarChart data={chartData.realtime} color="#EC4899" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="subheading-text">Recent Activity</CardTitle>
              <CardDescription>Latest actions across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivityList
                activities={activities as ClientActivity[]}
                isLoading={isActivitiesLoading}
                highlightedId={highlightedActivity}
                onActivityClick={handleActivityClick}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-start mt-6">
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/clients')}
              >
                View All Clients
              </Button>
              <Button 
                onClick={() => setIsAddClientModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </div>
          </div>

          <NewClientModal 
            isOpen={isAddClientModalOpen}
            onClose={() => setIsAddClientModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
