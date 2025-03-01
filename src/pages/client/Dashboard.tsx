
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { useClientDashboard } from "@/hooks/useClientDashboard";

const ClientDashboard = () => {
  const {
    clientName,
    agentName,
    interactionStats,
    isLoadingStats,
    commonQueries,
    isLoadingQueries,
    errorLogs,
    isLoadingErrors
  } = useClientDashboard();

  if (isLoadingStats || isLoadingQueries || isLoadingErrors) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Dashboard</h1>
          <p className="text-gray-500">
            {clientName ? `Welcome back, ${clientName}` : 'Monitor your AI Assistant performance'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <InteractionStats stats={interactionStats} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Common User Questions</CardTitle>
              <CardDescription>
                Frequently asked questions by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QueryList queries={commonQueries || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Issues</CardTitle>
              <CardDescription>
                Recent errors or issues detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorLogList errors={errorLogs || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
