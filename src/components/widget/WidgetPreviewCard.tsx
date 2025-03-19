
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreviewCard({ settings, clientId }: WidgetPreviewCardProps) {
  return (
    <Card className="border-2 border-indigo-100 shadow-lg sticky top-6 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
        <CardTitle className="text-indigo-700">Live Widget Preview</CardTitle>
        <CardDescription>
          This is exactly how your widget will appear to your website visitors. 
          Click the chat icon to interact with a demo version powered by your actual content.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <WidgetPreview settings={settings} clientId={clientId} />
      </CardContent>
    </Card>
  );
}
