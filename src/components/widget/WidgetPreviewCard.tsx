
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WidgetSettings } from '@/types/widget-settings';

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreviewCard({ settings, clientId }: WidgetPreviewCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setError('No client ID available for preview');
      return;
    }

    try {
      // Calculate the preview URL based on settings and clientId
      // Use production URL from environment or fallback to localhost
      const baseUrl = import.meta.env.VITE_CHAT_WIDGET_URL || 'https://chat-widget.gaiivoai.com';
      
      // Create a URL object for proper query parameter handling
      const url = new URL(`${baseUrl}/preview`);
      
      // Add all necessary parameters
      url.searchParams.append('clientId', clientId);
      url.searchParams.append('agentName', settings.agent_name || '');
      
      // Add additional settings as needed
      if (settings.chat_color) url.searchParams.append('primaryColor', settings.chat_color);
      if (settings.chat_color) url.searchParams.append('chatColor', settings.chat_color);
      if (settings.background_color) url.searchParams.append('backgroundColor', settings.background_color);
      if (settings.text_color) url.searchParams.append('textColor', settings.text_color);
      if (settings.font_color) url.searchParams.append('fontColor', settings.font_color);
      if (settings.chat_font_color) url.searchParams.append('chatFontColor', settings.chat_font_color);
      if (settings.logo_url) url.searchParams.append('logoUrl', settings.logo_url);
      if (settings.position) url.searchParams.append('position', settings.position);
      if (settings.welcome_text) url.searchParams.append('welcomeText', settings.welcome_text);
      if (settings.button_text) url.searchParams.append('buttonText', settings.button_text);
      
      // Set the preview URL
      setPreviewUrl(url.toString());
      setError(null);
    } catch (err) {
      console.error('Error creating preview URL:', err);
      setError('Unable to generate preview link');
    }
  }, [clientId, settings]);

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
        ) : previewUrl ? (
          <div className="w-full h-[500px] border border-gray-200 rounded-md overflow-hidden">
            <iframe 
              src={previewUrl}
              className="w-full h-full"
              title="Widget Preview"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-gray-500">Loading preview...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
