
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/useClient";
import { supabase } from "@/integrations/supabase/client";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { createClientActivity } from "@/services/clientActivityService";
// Use the type directly from integrations/supabase/types
import { ActivityType } from "@/integrations/supabase/types";

export default function ResourceSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { client, isLoading } = useClient(clientId || '');

  // Log client activity
  const handleLogActivity = async (
    activityType: ActivityType,
    description: string,
    metadata?: Json
  ) => {
    if (!clientId) return;
    try {
      await logClientActivity(clientId, activityType, description, metadata);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted-foreground mb-4">Client not found</p>
        <Button asChild>
          <Link to="/client/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <PageHeading>Resources & Knowledge</PageHeading>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/client/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">Agent Knowledge Base</h2>
        <p className="text-muted-foreground mb-4">
          Manage the resources that provide your AI agent with knowledge. Add URLs to crawl and document links to process.
        </p>
        
        <ClientResourceSections 
          clientId={clientId || ''} 
          agentName={client.agent_name || client.name || 'AI Assistant'}
          className="mt-8"
          isClientView={true}
          logClientActivity={handleLogActivity}
        />
      </Card>
    </div>
  );
}
