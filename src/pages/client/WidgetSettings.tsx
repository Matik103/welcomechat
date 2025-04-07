
import React, { useEffect, useState } from 'react';
import { useClientData } from '@/hooks/useClientData';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { WidgetSettingsForm } from '@/components/client/forms/WidgetSettingsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetSettingsContainer } from '@/components/widget/WidgetSettingsContainer';
import { WidgetPreview } from '@/components/widget/WidgetPreview';
import { setupDeepSeekAssistant } from '@/utils/clientDeepSeekUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { WidgetSettings as WidgetSettingsType } from '@/types/widget-settings';

export function ClientWidgetSettings() {
  const { user, userId, userRole, userClientId } = useAuth();
  const { client, isLoadingClient, error, clientMutation, clientId, refetchClient } = useClientData(userClientId || '');
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  
  const widgetSettings = client?.widget_settings as WidgetSettingsType || {};
  const hasDeepSeekAssistant = client?.deepseek_assistant_id || 
                              (client?.widget_settings as WidgetSettingsType)?.deepseek_assistant_id;
  
  const handleSetupAssistant = async () => {
    if (!client?.id) {
      toast.error('Client ID is required');
      return;
    }
    
    setIsSetupLoading(true);
    
    try {
      const clientName = client.client_name || 'Client';
      const agentName = (client.widget_settings as WidgetSettingsType)?.agent_name || client.agent_name || 'AI Assistant';
      const agentDescription = (client.widget_settings as WidgetSettingsType)?.agent_description || client.agent_description || '';
      
      const result = await setupDeepSeekAssistant(
        client.id,
        agentName,
        agentDescription,
        clientName
      );
      
      if (result.success) {
        toast.success('DeepSeek assistant setup successfully');
        refetchClient();
      } else {
        toast.error(`Failed to setup DeepSeek assistant: ${result.message}`);
      }
    } catch (error) {
      console.error('Error setting up DeepSeek assistant:', error);
      toast.error(`Error setting up DeepSeek assistant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSetupLoading(false);
    }
  };
  
  if (isLoadingClient) {
    return <div>Loading client data...</div>;
  }

  if (error) {
    return <div>Error loading client data: {error.toString()}</div>;
  }

  return (
    <div className="container mx-auto my-8">
      <PageHeading>
        Widget Settings
        <p className="text-sm font-normal text-muted-foreground">
          Configure your chat widget
        </p>
      </PageHeading>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div>
          <WidgetSettingsForm 
            initialData={client}
            onSubmit={async (data) => {
              console.log('Widget settings updated:', data);
              await clientMutation.mutateAsync({
                ...client,
                widget_settings: {
                  ...(client?.widget_settings || {}),
                  ...data
                }
              });
            }}
            isLoading={isLoadingClient || clientMutation.isPending}
            isClientView={true}
          />
          
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  DeepSeek AI Integration
                  <Badge variant={hasDeepSeekAssistant ? "success" : "outline"}>
                    {hasDeepSeekAssistant ? 'Configured' : 'Not Configured'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Enable DeepSeek AI integration for your assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasDeepSeekAssistant ? (
                  <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      DeepSeek assistant is configured and ready to use
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      No DeepSeek assistant configured for your account
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  onClick={handleSetupAssistant}
                  disabled={isSetupLoading}
                  className="w-full mt-4"
                >
                  {isSetupLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Setting up assistant...
                    </>
                  ) : hasDeepSeekAssistant ? (
                    'Update DeepSeek Assistant'
                  ) : (
                    'Setup DeepSeek Assistant'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>
                This is how your chat widget will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetSettingsContainer widgetSettings={widgetSettings} clientId={clientId}>
                <WidgetPreview />
              </WidgetSettingsContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Instructions</CardTitle>
              <CardDescription>
                How to add this widget to your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {`<script>
  // Add this script to your website
  (function(w,d,s,o,f,js,fjs){
    w['ItTalentWidget']=o;w[o]=w[o]||function(){
      (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','itta','https://widget.example.com/loader.js'));
  
  // Initialize with your client ID
  itta('init', { clientId: '${clientId || 'YOUR_CLIENT_ID'}' });
</script>`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ClientWidgetSettings;
