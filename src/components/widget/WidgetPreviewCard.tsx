
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WidgetSettings } from '@/types/widget-settings';
import { WidgetPreview } from './WidgetPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
  onTestInteraction?: () => Promise<void>;
}

export function WidgetPreviewCard({ settings, clientId, onTestInteraction }: WidgetPreviewCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<string>(settings.display_mode || 'floating');

  useEffect(() => {
    if (!clientId) {
      setError('No client ID available for preview');
    } else {
      setError(null);
    }
  }, [clientId]);

  // Update display mode when settings change
  useEffect(() => {
    setDisplayMode(settings.display_mode || 'floating');
  }, [settings.display_mode]);

  const handleDisplayModeChange = (mode: string) => {
    setDisplayMode(mode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
        <CardDescription>See how your widget will appear to users</CardDescription>
        
        <Tabs value={displayMode} onValueChange={handleDisplayModeChange} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="floating">Floating Bubble</TabsTrigger>
            <TabsTrigger value="inline">Inline Widget</TabsTrigger>
            <TabsTrigger value="sidebar">Sidebar Panel</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="w-full h-[550px] border border-gray-200 rounded-md overflow-hidden shadow-sm bg-white">
            <WidgetPreview 
              settings={{...settings, display_mode: displayMode}} 
              clientId={clientId || ""} 
              onTestInteraction={onTestInteraction}
              key={`widget-preview-${clientId}-${displayMode}`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
