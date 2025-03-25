
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';
import WebsiteUrlForm from '@/components/client/website-urls/WebsiteUrlForm';
import WebsiteUrlsList from '@/components/client/website-urls/WebsiteUrlsList';
import DocumentLinkForm from '@/components/client/drive-links/DocumentLinkForm';
import DocumentLinksList from '@/components/client/drive-links/DocumentLinksList';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { useClientActivity } from '@/hooks/useClientActivity';

export default function ResourceSettings() {
  const { clientId } = useParams<{ clientId: string }>();
  const { logClientActivity } = useClientActivity(clientId);

  if (!clientId) {
    return <div>Client ID is required</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto pb-8">
        <PageHeading>Resource Settings</PageHeading>
        
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
                    onSuccess={() => logClientActivity("website_url_added", "Added new website URL")}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Website URLs</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebsiteUrlsList 
                    clientId={clientId}
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
                    clientId={clientId}
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
                    clientId={clientId}
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
