
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { WebsiteUrlsList } from "@/components/client/website-urls/WebsiteUrlsList";
import { DocumentLinksList } from "@/components/client/drive-links/DocumentLinksList";
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

  const handleAddWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      await addWebsiteUrlMutation.mutateAsync(data);
      await logClientActivity("website_url_added", "Added new website URL");
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding website URL:", error);
      toast.error("Failed to add website URL");
      return Promise.reject(error);
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    try {
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      await logClientActivity("website_url_deleted", "Deleted website URL");
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting website URL:", error);
      toast.error("Failed to delete website URL");
      return Promise.reject(error);
    }
  };

  const handleAddDocumentLink = async (data: { link: string; refresh_rate: number }) => {
    try {
      await addDocumentLink.mutateAsync(data);
      await logClientActivity("document_link_added", "Added new document link");
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding document link:", error);
      toast.error("Failed to add document link");
      return Promise.reject(error);
    }
  };

  const handleDeleteDocumentLink = async (linkId: number) => {
    try {
      await deleteDocumentLink.mutateAsync(linkId);
      await logClientActivity("document_link_deleted", "Deleted document link");
      return Promise.resolve();
    } catch (error) {
      console.error("Error deleting document link:", error);
      toast.error("Failed to delete document link");
      return Promise.reject(error);
    }
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
          logClientActivity={logClientActivity}
        />
      </div>
    </div>
  );
}
