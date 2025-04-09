
import React, { useEffect, useState } from 'react';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';

interface WidgetPreviewProps {
  settings?: WidgetSettings;
  clientId?: string;
}

export const WidgetPreview = ({ settings = defaultSettings, clientId }: WidgetPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get stylesheet variables from settings
  const getStyleVariables = () => {
    if (!settings) return {};
    
    const primaryColor = settings.chat_color || settings.color || '#4F46E5';
    
    return {
      '--primary-color': primaryColor,
      '--button-color': settings.button_color || primaryColor,
      '--text-color': settings.text_color || settings.font_color || '#111827',
      '--bg-color': settings.background_color || '#FFFFFF',
      '--font-family': settings.fontFamily || 'Inter, system-ui, sans-serif'
    } as React.CSSProperties;
  };
  
  // Handle toggle chat
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="widget-preview" style={getStyleVariables()}>
      {/* Chat Window */}
      {isOpen && (
        <div className="widget-window bg-white shadow-lg rounded-lg border overflow-hidden flex flex-col" style={{maxWidth: '350px', height: '450px'}}>
          {/* Chat Header */}
          <div className="chat-header p-4 flex items-center space-x-2" style={{background: getStyleVariables()['--primary-color']}}>
            {settings?.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-8 w-8 rounded" 
              />
            )}
            <div className="flex-1">
              <h3 className="text-white font-medium">{settings?.agent_name || 'AI Assistant'}</h3>
              <p className="text-white text-xs opacity-80">{settings?.agent_description || 'Ready to help'}</p>
            </div>
            <button onClick={handleToggle} className="text-white hover:bg-white/10 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4">
              <div className="bg-gray-100 rounded-lg p-3 inline-block max-w-[80%]">
                <p className="text-gray-800">{settings?.greeting_message || settings?.welcome_message || 'Hello! How can I help you today?'}</p>
              </div>
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="p-3 border-t">
            <div className="flex">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                style={{background: getStyleVariables()['--primary-color']}} 
                className="px-4 py-2 rounded-r-lg text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Button */}
      {!isOpen && (
        <button 
          onClick={handleToggle}
          className="chat-button text-white rounded-full p-3 shadow-lg flex items-center justify-center"
          style={{
            background: getStyleVariables()['--button-color'],
            width: '60px',
            height: '60px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default WidgetPreview;
