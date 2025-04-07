
import React from 'react';
import { WidgetPreview } from '../widget/WidgetPreview';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';

export function AssistantTest() {
  // Create a complete settings object by spreading the default settings
  // and overriding specific properties
  const settings: WidgetSettings = {
    ...defaultSettings,
    agent_name: "Test Assistant",
    agent_description: "I'm here to help answer questions about your documents",
    chat_color: "#3b82f6",
    text_color: "#ffffff",
    background_color: "#ffffff"
  };

  const clientId = "3457bc81-efe7-4961-8395-d23f06dd7924";

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Assistant Preview</h1>
        <p className="text-gray-600">Test your assistant's responses to queries.</p>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <WidgetPreview 
          settings={settings}
          clientId={clientId}
        />
      </div>
    </div>
  );
} 
