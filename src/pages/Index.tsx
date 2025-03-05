import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useInteractionStats } from "@/hooks/useInteractionStats";

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  
  const { stats, isLoading: isLoadingStats } = useInteractionStats();
  
  // Fix the error by properly using the stats object
  const totalInteractions = stats?.totalInteractions ?? 0;
  const totalErrorRate = stats?.errorRate ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">
            Welcome to your dashboard. Here you can manage clients and view
            overall statistics.
          </p>
          <p className="text-gray-500">
            Current Time: {currentTime.toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Interactions</CardTitle>
              <CardDescription>
                Total number of interactions across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalInteractions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Rate</CardTitle>
              <CardDescription>
                Percentage of interactions resulting in errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalErrorRate.toFixed(2)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Clients</CardTitle>
              <CardDescription>Add, edit, and manage client accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/clients">
                <Button className="w-full justify-between">
                  Go to Clients <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
