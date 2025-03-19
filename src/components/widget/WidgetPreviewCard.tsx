
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
}

export function WidgetPreviewCard({ settings }: WidgetPreviewCardProps) {
  return (
    <Card className="border-2 border-indigo-100 shadow-lg sticky top-6">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="text-indigo-700">Live Widget Preview</CardTitle>
        <CardDescription>
          This is exactly how your widget will appear to your website visitors. 
          Click the chat icon to interact with a demo version.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        <WidgetPreview settings={settings} />
      </CardContent>
    </Card>
  );
}
