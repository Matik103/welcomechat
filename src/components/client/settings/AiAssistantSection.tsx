
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetSettings } from "@/types/widget-settings";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createOpenAIAssistant } from "@/utils/openAIUtils";
import { toast } from "sonner";
import EmbedCodeCard from "@/components/widget/EmbedCodeCard";

interface AiAssistantSectionProps {
  settings: WidgetSettings;
  onSettingsChange: (newSettings: Partial<WidgetSettings>) => void;
  clientId: string;
}

export function AiAssistantSection({ 
  settings, 
  onSettingsChange, 
  clientId 
}: AiAssistantSectionProps) {
  const [isUpdatingAssistant, setIsUpdatingAssistant] = useState(false);
  
  const handleUpdateSystemPrompt = () => {
    if (!settings.agent_description) {
      toast.error("System prompt cannot be empty");
      return;
    }
    
    setIsUpdatingAssistant(true);
    
    createOpenAIAssistant(
      clientId,
      settings.agent_name,
      settings.agent_description
    )
      .then((assistantId) => {
        toast.success("AI Assistant updated successfully");
        // Update settings with the assistant ID
        if (settings.hasOwnProperty('openai_assistant_id')) {
          // If the property already exists
          onSettingsChange({
            openai_assistant_id: assistantId
          } as any); // Use type assertion as a workaround
        } else {
          // Just update other properties
          toast.success("Assistant configured successfully");
        }
      })
      .catch((error) => {
        console.error("Error updating OpenAI assistant:", error);
        toast.error("Failed to update AI Assistant");
      })
      .finally(() => {
        setIsUpdatingAssistant(false);
      });
  };

  const handleCopyCode = () => {
    toast.success("Widget code copied to clipboard!");
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Settings</CardTitle>
          <CardDescription>
            Configure how your AI assistant behaves when interacting with users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assistant-name">Assistant Name</Label>
            <Input
              id="assistant-name"
              value={settings.agent_name}
              onChange={(e) => onSettingsChange({ agent_name: e.target.value })}
              placeholder="AI Assistant"
            />
            <p className="text-xs text-muted-foreground">
              This is how your assistant will introduce itself
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt / Instructions</Label>
            <Textarea
              id="system-prompt"
              value={settings.agent_description || ""}
              onChange={(e) => onSettingsChange({ agent_description: e.target.value })}
              placeholder="You are a helpful assistant that answers questions about our company and products."
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              This system prompt guides how your AI assistant responds to user queries
            </p>
          </div>
          
          <Button
            onClick={handleUpdateSystemPrompt}
            variant="outline"
            disabled={isUpdatingAssistant}
            className="mt-2"
          >
            {isUpdatingAssistant ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Assistant...
              </>
            ) : (
              'Update AI Assistant'
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-6">
        <EmbedCodeCard 
          settings={settings}
          onCopy={handleCopyCode}
        />
      </div>
    </>
  );
}
