import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { supabase } from "@/integrations/supabase/client";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activities, isLoading } = useRecentActivities();
  
  // Check if password change is required
  useEffect(() => {
    if (user && user.user_metadata?.password_change_required) {
      toast(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="font-medium">For security reasons, please set up a new password</span>
          </div>
          <Button size="sm" onClick={() => navigate("/client/settings")}>
            Change Password
          </Button>
        </div>
      , {
        duration: 10000,
        position: "top-center",
      });
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your AI assistant</p>
        </div>

        <InteractionStats />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryList queries={activities} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorLogList errors={activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
