
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { useDocumentLinks } from "@/hooks/useDocumentLinks";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ActivityType } from "@/types/client-form";
import { ClientResourceSections } from "@/components/client/ClientResourceSections";

export default function ResourceSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { logClientActivity } = useClientActivity(clientId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    refetchWebsiteUrls
  } = useWebsiteUrls(clientId);

  const {
    documentLinks,
    isLoading: isLoadingDocs,
    addDocumentLink,
    deleteDocumentLink,
    refetch: refetchDocumentLinks
  } = useDocumentLinks(clientId);

  if (!clientId) {
    return <div>Client ID is required</div>;
  }
  
  const wrappedLogClientActivity = async (
    activity_type: ActivityType, 
    description: string, 
    metadata?: Record<string, any>
  ) => {
    if (logClientActivity) {
      try {
        await logClientActivity(activity_type, description, metadata);
        return Promise.resolve();
      } catch (error) {
        console.error("Error logging activity:", error);
        return Promise.resolve();
      }
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto pb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Resource Settings</h1>
        
        <ClientResourceSections 
          clientId={clientId}
          websiteUrls={websiteUrls}
          isProcessing={isProcessing}
          isDeleting={isDeleting}
          refetchWebsiteUrls={refetchWebsiteUrls}
          logClientActivity={wrappedLogClientActivity}
        />
      </div>
    </div>
  );
}
