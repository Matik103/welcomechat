
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmbedCode } from "@/components/widget/EmbedCode";
import { WidgetSettings } from "@/types/widget-settings";

interface EmbedCodeCardProps {
  settings: WidgetSettings;
  onCopy: () => void;
}

export function EmbedCodeCard({ settings, onCopy }: EmbedCodeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Code</CardTitle>
        <CardDescription>Copy this code to add the widget to your website</CardDescription>
      </CardHeader>
      <CardContent>
        <EmbedCode 
          settings={settings} 
          onCopy={onCopy}
        />
      </CardContent>
    </Card>
  );
}
