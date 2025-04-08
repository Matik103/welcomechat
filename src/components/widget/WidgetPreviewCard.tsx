
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { WidgetSettings } from "@/types/widget-settings";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetPreviewProps {
  settings: WidgetSettings;
  clientId: string;
  onInteraction?: () => Promise<void>;
}

export function WidgetPreviewCard({ settings, clientId, onInteraction }: WidgetPreviewProps) {
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  
  // Refresh the preview when settings change
  useEffect(() => {
    setPreviewKey(Date.now());
  }, [
    settings.agent_name,
    settings.logo_url,
    settings.chat_color,
    settings.background_color,
    settings.button_color,
    settings.button_text,
    settings.position,
    settings.greeting_message,
    settings.display_mode,
    settings.welcome_text,
    settings.response_time_text
  ]);
  
  const handleOpenPreview = useCallback(async () => {
    // Validate if clientId is available
    if (!clientId) {
      console.error('Client ID is required to open the preview');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Log the interaction if callback is provided
      if (onInteraction) {
        await onInteraction();
      }
      
      // Open the preview in a new window
      const previewUrl = `${window.location.origin}/preview/${clientId}`;
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening preview:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, onInteraction]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Widget Preview
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenPreview}
            disabled={isLoading || !clientId}
            className="flex items-center gap-2"
          >
            <ExternalLink size={16} />
            <span>Open in New Tab</span>
          </Button>
        </CardTitle>
        <CardDescription>
          This is how your AI assistant widget will appear on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="border rounded-md p-0 h-[500px] relative">
        <WidgetPreview 
          settings={settings} 
          clientId={clientId} 
          key={previewKey} 
        />
      </CardContent>
    </Card>
  );
}
