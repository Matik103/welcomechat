
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WebsiteUrlForm } from "@/components/client/website-urls/WebsiteUrlForm";
import { WebsiteUrlsList } from "@/components/client/website-urls/WebsiteUrlsList";
import { DocumentLinkForm } from "@/components/client/drive-links/DocumentLinkForm";
import { DocumentLinksList } from "@/components/client/drive-links/DocumentLinksList";
import { Button } from "@/components/ui/button";
import { useWebsiteUrls } from "@/hooks/useWebsiteUrls";
import { useDocumentLinks } from "@/hooks/useDocumentLinks";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientActivity } from "@/hooks/useClientActivity";
import { ActivityType } from "@/types/client-form";

export default function ResourceSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { logClientActivity } = useClientActivity(clientId);

  if (!clientId) {
    return <div>Client ID is required</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto pb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Resource Settings</h1>
        
        <Tabs defaultValue="websites" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="websites">Website URLs</TabsTrigger>
            <TabsTrigger value="documents">Document Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="websites">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Website URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebsiteUrlForm 
                    clientId={clientId} 
                    onAddSuccess={() => logClientActivity("website_url_added", "Added new website URL")}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Website URLs</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebsiteUrlsList 
                    onDelete={() => logClientActivity("url_deleted", "Deleted website URL")}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Document Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentLinkForm 
                    onSuccess={() => logClientActivity("document_link_added", "Added new document link")}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Document Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentLinksList 
                    onDelete={() => logClientActivity("document_link_deleted", "Deleted document link")}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
