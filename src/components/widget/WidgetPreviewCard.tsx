
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WidgetSettings } from '@/types/widget-settings';
import { WidgetPreview } from './WidgetPreview';

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreviewCard({ settings, clientId }: WidgetPreviewCardProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setError('No client ID available for preview');
    } else {
      setError(null);
    }
  }, [clientId]);

  // Get a display name based on the selected mode
  const getDisplayModeName = () => {
    switch(settings.display_mode) {
      case 'inline': return 'Inline Widget';
      case 'sidebar': return 'Sidebar Panel';
      case 'floating': return 'Floating Bubble';
      default: return 'Widget Preview';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Preview - {getDisplayModeName()}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {error ? (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="w-full h-[550px] border border-gray-200 rounded-md overflow-hidden">
            <WidgetPreview 
              settings={settings} 
              clientId={clientId} 
              key={`widget-preview-${clientId}-${settings.display_mode}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
