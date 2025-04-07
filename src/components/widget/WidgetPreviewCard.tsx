
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WidgetSettings } from '@/types/widget-settings';
import { cn } from '@/lib/utils';

export interface WidgetPreviewProps {
  settings: WidgetSettings;
  clientId: string;
}

export function WidgetPreviewCard({ settings, clientId }: WidgetPreviewProps) {
  const { agent_name, agent_description, chat_color, background_color, button_color, font_color, button_text, position, greeting_message, text_color, secondary_color, welcome_text, response_time_text, display_mode } = settings;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start p-4 rounded-md"
          style={{
            backgroundColor: background_color,
            color: font_color,
            opacity: settings.background_opacity,
            width: '100%'
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-8 h-8 rounded-full bg-gray-300"
              style={{ backgroundColor: secondary_color }}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none" style={{ color: text_color }}>
                {agent_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {response_time_text}
              </p>
            </div>
          </div>
          <div className="w-full p-3 rounded-md" style={{ backgroundColor: chat_color, color: settings.chat_font_color }}>
            {greeting_message}
          </div>
        </div>
        <div className="flex justify-end">
          <Badge
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "hover:bg-secondary/80"
            )}
            style={{
              backgroundColor: button_color,
              color: font_color,
            }}
          >
            {button_text}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function WidgetPreviewCards({ settings, clientId }: WidgetPreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <WidgetPreviewCard settings={settings} clientId={clientId} />
    </div>
  );
}
