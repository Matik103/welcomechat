
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmbedCode } from "@/components/widget/EmbedCode";
import { WidgetSettings } from "@/types/widget-settings";
import { useEffect, useState } from "react";

interface EmbedCodeCardProps {
  settings: WidgetSettings;
  onCopy: () => void;
}

export function EmbedCodeCard({ settings, onCopy }: EmbedCodeCardProps) {
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  
  // Update the lastUpdateTime whenever settings change to trigger re-rendering
  useEffect(() => {
    setLastUpdateTime(Date.now());
  }, [
    settings.agent_name,
    settings.logo_url,
    settings.chat_color,
    settings.background_color,
    settings.button_color,
    settings.position,
    settings.welcome_text,
    settings.response_time_text,
    settings.display_mode,
    settings.secondary_color,
    settings.text_color,
    settings.greeting_message,
    settings.openai_assistant_id,
    settings.clientId
  ]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Code</CardTitle>
        <CardDescription>
          Copy this code to add the widget to your website. The code automatically updates with your settings changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmbedCode 
          settings={settings} 
          onCopy={onCopy}
          key={`embed-code-${lastUpdateTime}`}
        />
      </CardContent>
    </Card>
  );
}
