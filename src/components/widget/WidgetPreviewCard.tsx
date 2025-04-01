
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setError('No client ID available for preview');
      return;
    } else {
      setError(null);
      setIsLoaded(true);
    }
    
    console.log("WidgetPreviewCard - Rendering with client ID:", clientId);
  }, [clientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
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
              key={`widget-preview-${clientId}-${isLoaded}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
