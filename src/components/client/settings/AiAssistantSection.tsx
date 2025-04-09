
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { setupDeepSeekAssistant } from '@/utils/clientDeepSeekUtils';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Client } from '@/types/client';
import { WidgetSettings } from '@/types/widget-settings';

interface AiAssistantSectionProps {
  client: Client | null;
  onAssistantSetup?: () => void;
}

export const AiAssistantSection = ({ client, onAssistantSetup }: AiAssistantSectionProps) => {
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState<boolean | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  
  const hasDeepSeekAssistant = client?.deepseek_assistant_id || 
                              (client?.widget_settings && (client.widget_settings as WidgetSettings)?.deepseek_assistant_id);
  
  const handleSetupAssistant = async () => {
    if (!client?.id) {
      toast.error('Client ID is required');
      return;
    }
    
    setIsSetupLoading(true);
    setSetupSuccess(null);
    setSetupError(null);
    
    try {
      const widgetSettings = client?.widget_settings as WidgetSettings;
      const clientName = client?.client_name || widgetSettings?.agent_name || 'Client';
      const agentName = client?.agent_name || widgetSettings?.agent_name || 'AI Assistant';
      const agentDescription = client?.agent_description || widgetSettings?.agent_description || '';
      
      const result = await setupDeepSeekAssistant(
        client.id,
        agentName,
        agentDescription,
        clientName
      );
      
      if (result.success) {
        setSetupSuccess(true);
        toast.success('DeepSeek assistant setup successfully');
        
        if (onAssistantSetup) {
          onAssistantSetup();
        }
      } else {
        setSetupSuccess(false);
        setSetupError(result.message || 'Unknown error');
        toast.error(`Failed to setup DeepSeek assistant: ${result.message}`);
      }
    } catch (error) {
      console.error('Error setting up DeepSeek assistant:', error);
      setSetupSuccess(false);
      setSetupError(error instanceof Error ? error.message : String(error));
      toast.error(`Error setting up DeepSeek assistant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSetupLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant Configuration</CardTitle>
        <CardDescription>
          Configure the AI assistant for this client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              No DeepSeek assistant configured for this client
            </AlertDescription>
          </Alert>
        )}
        
        {setupSuccess === true && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              DeepSeek assistant setup completed successfully
            </AlertDescription>
          </Alert>
        )}
        
        {setupSuccess === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to setup DeepSeek assistant: {setupError}
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleSetupAssistant}
          disabled={isSetupLoading}
          className="w-full"
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
  );
};
