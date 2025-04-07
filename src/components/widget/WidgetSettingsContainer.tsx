
import { useEffect } from 'react';
import { WidgetSettings, defaultSettings } from '@/types/widget-settings';

interface WidgetSettingsContainerProps {
  widgetSettings?: WidgetSettings | null;
  clientId?: string | null;
  className?: string;
  children?: React.ReactNode;
}

export const WidgetSettingsContainer = ({ 
  widgetSettings, 
  clientId, 
  className = '',
  children 
}: WidgetSettingsContainerProps) => {
  useEffect(() => {
    // Initialize widget settings
    const initWidget = () => {
      try {
        if (typeof window === 'undefined') return;
        
        // Initialize widget globals
        if (!window.ItTalentAi) {
          window.ItTalentAi = {
            init: (settings) => {
              console.log('Initializing widget with settings:', settings);
            },
            customSettings: {},
            chatHistory: [],
          };
        }
        
        // Apply settings from props
        if (widgetSettings) {
          window.ItTalentAi.customSettings = {
            ...window.ItTalentAi.customSettings,
            clientId: clientId || widgetSettings.clientId || widgetSettings.client_id,
            agentName: widgetSettings.agent_name || 'AI Assistant',
            agentDescription: widgetSettings.agent_description || '',
            primaryColor: widgetSettings.chat_color || widgetSettings.color || '#4F46E5',
            fontFamily: widgetSettings.fontFamily || 'Inter',
            fontSize: widgetSettings.fontSize || 'md',
            welcomeMessage: widgetSettings.greeting_message || widgetSettings.welcome_message || 'Hello! How can I help you today?',
            logoUrl: widgetSettings.logo_url || widgetSettings.logo_path || widgetSettings.logo || null,
            deepseekEnabled: widgetSettings.deepseek_enabled || false,
            deepseekModel: widgetSettings.deepseek_model || 'deepseek-chat',
            deepseekAssistantId: widgetSettings.deepseek_assistant_id || null
          };
        }
      } catch (error) {
        console.error('Error initializing widget:', error);
      }
    };
    
    initWidget();
  }, [widgetSettings, clientId]);
  
  // Render children wrapper (if any)
  if (children) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }
  
  // Default: render nothing
  return null;
};

// Define the ItTalentAi interface for the window object
declare global {
  interface Window {
    ItTalentAi?: {
      init: (settings: any) => void;
      customSettings: any;
      chatHistory: any[];
    };
  }
}

export default WidgetSettingsContainer;
