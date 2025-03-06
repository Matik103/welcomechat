
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WidgetPreview } from "@/components/widget/WidgetPreview";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
}

export function WidgetPreviewCard({ settings }: WidgetPreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
        <CardDescription>See how your widget will appear to visitors. Click the chat icon to expand the preview.</CardDescription>
      </CardHeader>
      <CardContent>
        <WidgetPreview settings={settings} />
      </CardContent>
    </Card>
  );
}
