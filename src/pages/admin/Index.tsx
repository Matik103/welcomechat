import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const navigate = useNavigate();
  // ... existing state and useEffect ...

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Clients Card */}
        <div 
          onClick={() => handleCardClick('/admin/clients')}
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Clients</h3>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
              <div className="bg-blue-400 p-3 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <p className="text-blue-100">Manage client accounts and settings</p>
          </Card>
        </div>

        {/* Agents Card */}
        <div 
          onClick={() => handleCardClick('/admin/agents')}
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Agents</h3>
                <p className="text-2xl font-bold">{totalAgents}</p>
              </div>
              <div className="bg-purple-400 p-3 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
            </div>
            <p className="text-purple-100">View and manage AI agents</p>
          </Card>
        </div>

        {/* Interactions Card */}
        <div className="cursor-not-allowed opacity-75">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Interactions</h3>
                <p className="text-2xl font-bold">{totalInteractions}</p>
              </div>
              <div className="bg-green-400 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <p className="text-green-100">Coming soon: View all interactions</p>
          </Card>
        </div>

        {/* Trainings Card */}
        <div className="cursor-not-allowed opacity-75">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Trainings</h3>
                <p className="text-2xl font-bold">{totalTrainings}</p>
              </div>
              <div className="bg-orange-400 p-3 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <p className="text-orange-100">Coming soon: View all training materials</p>
          </Card>
        </div>

        {/* Administration Card */}
        <div 
          onClick={() => handleCardClick('/admin/settings')}
          className="cursor-pointer transform transition-all duration-300 hover:scale-105"
        >
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Administration</h3>
                <p className="text-2xl font-bold">{totalAdministration}</p>
              </div>
              <div className="bg-pink-400 p-3 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
            </div>
            <p className="text-pink-100">Manage system settings and configurations</p>
          </Card>
        </div>
      </div>

      {/* Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ... existing monitoring cards ... */}
      </div>
    </div>
  );
};

export default Index; 