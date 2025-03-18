
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { Loader2 } from "lucide-react";
import { AdminDashboardTools } from "@/components/admin/AdminDashboardTools";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: activities, isLoading, error } = useRecentActivities();
  const [activeTab, setActiveTab] = useState<string>("overview");

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back {user?.user_metadata?.full_name || user?.email}
        </p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6">
            <AdminDashboardTools />
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Administration Tools</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AdminDashboardTools />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-red-500 p-4">Error loading activities: {error.message}</div>
              ) : (
                <ActivityList activities={activities} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
