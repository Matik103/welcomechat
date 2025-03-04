
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useClientDashboard, InteractionStats } from "@/hooks/useClientDashboard";
import InteractionStatsComponent from "@/components/client-dashboard/InteractionStats";
import QueryList from "@/components/client-dashboard/QueryList";
import ErrorLogList from "@/components/client-dashboard/ErrorLogList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// Component for consistent section styling
const DashboardSection = ({ title, description, children }: DashboardSectionProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const ClientDashboard = () => {
  const { stats, interactionStats, commonQueries, errorLogs, isLoading } = useClientDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Dashboard</h1>
          <p className="text-gray-600">Monitor your AI Assistant performance</p>
        </div>
        <Link to="/client/settings" className="text-primary hover:underline">
          Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardSection
          title="Interaction Statistics"
          description="Overview of your AI Assistant usage"
        >
          <InteractionStatsComponent stats={interactionStats} />
        </DashboardSection>

        <DashboardSection
          title="Common Queries"
          description="Most frequently asked questions"
        >
          <QueryList queries={commonQueries || []} />
        </DashboardSection>

        <DashboardSection
          title="Recent Errors"
          description="Issues that occurred with your AI Assistant"
        >
          <ErrorLogList errors={errorLogs || []} />
        </DashboardSection>
      </div>
    </div>
  );
};

export default ClientDashboard;
