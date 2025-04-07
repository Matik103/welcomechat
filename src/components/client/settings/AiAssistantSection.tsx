
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WidgetSettings } from "@/types/widget-settings";
import { Client } from "@/types/client";

interface AiAssistantSectionProps {
  settings: WidgetSettings;
  client?: Client;
  onSettingsChange: (partialSettings: Partial<WidgetSettings>) => void;
}

export function AiAssistantSection({ settings, client, onSettingsChange }: AiAssistantSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("general");
  const hasDeepseekAssistant = settings.deepseek_enabled && client?.deepseek_assistant_id;
  const hasOpenAiAssistant = settings.openai_enabled && settings.openai_assistant_id;
  
  const handleAgentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ agent_name: e.target.value });
  };
  
  const handleAgentDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({ agent_description: e.target.value });
  };
  
  const handleWelcomeMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({ welcome_message: e.target.value });
  };
  
  const handleToggleDeepseek = (checked: boolean) => {
    onSettingsChange({ 
      deepseek_enabled: checked,
      // If enabling Deepseek, disable OpenAI
      openai_enabled: checked ? false : settings.openai_enabled
    });
    
    if (checked && !client?.deepseek_assistant_id) {
      toast.warning("DeepSeek assistant not configured. Contact support.");
    }
  };
  
  const handleToggleOpenAI = (checked: boolean) => {
    onSettingsChange({
      openai_enabled: checked,
      // If enabling OpenAI, disable Deepseek
      deepseek_enabled: checked ? false : settings.deepseek_enabled
    });
    
    if (checked && !settings.openai_assistant_id) {
      toast.warning("OpenAI assistant ID not configured.");
    }
  };
  
  useEffect(() => {
    // Automatically switch to available assistant if none are enabled
    if (!settings.deepseek_enabled && !settings.openai_enabled) {
      if (client?.deepseek_assistant_id) {
        onSettingsChange({ deepseek_enabled: true });
      } else if (settings.openai_assistant_id) {
        onSettingsChange({ openai_enabled: true });
      }
    }
  }, [settings.deepseek_enabled, settings.openai_enabled, client?.deepseek_assistant_id, settings.openai_assistant_id]);
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">AI Assistant Settings</CardTitle>
        <CardDescription>Configure your AI assistant's personality and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai-model">AI Model</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Assistant Name</Label>
              <Input 
                id="agent-name" 
                value={settings.agent_name || ''} 
                onChange={handleAgentNameChange}
                placeholder="e.g. Support Assistant"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-description">Assistant Description</Label>
              <Textarea 
                id="agent-description" 
                value={settings.agent_description || ''} 
                onChange={handleAgentDescriptionChange}
                placeholder="Describe your assistant's purpose and expertise"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="welcome-message">Welcome Message</Label>
              <Textarea 
                id="welcome-message" 
                value={settings.welcome_message || ''} 
                onChange={handleWelcomeMessageChange}
                placeholder="Hi there! I'm your assistant. How can I help you today?"
                rows={3}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="ai-model" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base" htmlFor="deepseek-toggle">DeepSeek AI</Label>
                  <p className="text-sm text-muted-foreground">
                    Use DeepSeek's AI assistant capabilities
                  </p>
                </div>
                <Switch 
                  id="deepseek-toggle" 
                  checked={settings.deepseek_enabled || false}
                  onCheckedChange={handleToggleDeepseek}
                />
              </div>
              
              {settings.deepseek_enabled && !client?.deepseek_assistant_id && (
                <Alert variant="warning" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    DeepSeek assistant not configured. Contact support.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base" htmlFor="openai-toggle">OpenAI Assistant</Label>
                  <p className="text-sm text-muted-foreground">
                    Use OpenAI's GPT assistant capabilities
                  </p>
                </div>
                <Switch 
                  id="openai-toggle" 
                  checked={settings.openai_enabled || false}
                  onCheckedChange={handleToggleOpenAI}
                />
              </div>
              
              {settings.openai_enabled && !settings.openai_assistant_id && (
                <Alert variant="warning" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    OpenAI assistant ID not configured.
                  </AlertDescription>
                </Alert>
              )}
              
              {!hasDeepseekAssistant && !hasOpenAiAssistant && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No AI assistant is configured. Your widget will not work.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Advanced settings coming soon</Label>
              <p className="text-sm text-muted-foreground">
                More advanced settings will be available in a future update.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
