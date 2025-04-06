
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WidgetSettings } from '@/types/widget-settings';
import { WidgetPreview } from './WidgetPreview';

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
  onTestInteraction?: () => Promise<void>;
}

export function WidgetPreviewCard({ settings, clientId, onTestInteraction }: WidgetPreviewCardProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setError('No client ID available for preview');
    } else {
      setError(null);
    }
  }, [clientId]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
        <CardDescription>See how your widget will appear to users</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="w-full h-[500px] border border-gray-200 rounded-md overflow-hidden shadow-sm">
            <WidgetPreview 
              settings={settings} 
              clientId={clientId || ""} 
              onTestInteraction={onTestInteraction}
              key={`widget-preview-${clientId}-${settings.display_mode}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
