
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, X, MessageCircle } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewProps {
  settings: WidgetSettings;
  showPreview: boolean;
  onTogglePreview: (isVisible: boolean) => void;
}

export function WidgetPreview({ settings, showPreview, onTogglePreview }: WidgetPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => onTogglePreview(!showPreview)}
      >
        {showPreview ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Preview
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Show Preview
          </>
        )}
      </Button>
      
      {showPreview && (
        <div className="relative border border-gray-200 rounded-md p-4 h-96 bg-gray-50">
          {isExpanded ? (
            <div 
              className="absolute bottom-4 right-4 w-72 h-80 rounded-md shadow-lg overflow-hidden transition-all duration-300 ease-in-out"
              style={{ backgroundColor: settings.background_color }}
            >
              {/* Chat Header */}
              <div 
                className="p-3 flex items-center justify-between"
                style={{ backgroundColor: settings.chat_color }}
              >
                <div className="flex items-center gap-2">
                  {settings.logo_url && (
                    <img 
                      src={settings.logo_url} 
                      alt="Logo" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium text-sm text-white">{settings.agent_name || "AI Assistant"}</span>
                </div>
                <button 
                  onClick={toggleExpand}
                  className="text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Chat Body */}
              <div className="p-3 h-56 overflow-y-auto">
                {/* Welcome Message */}
                <div className="mb-4">
                  <div 
                    className="inline-block rounded-lg py-2 px-3 max-w-xs text-sm"
                    style={{ 
                      backgroundColor: settings.secondary_color,
                      color: 'white'
                    }}
                  >
                    {settings.welcome_text || "Hi 👋, how can I help?"}
                  </div>
                  <div 
                    className="text-xs mt-1 opacity-60"
                    style={{ color: settings.text_color }}
                  >
                    {settings.response_time_text || "I typically respond right away"}
                  </div>
                </div>
                
                {/* Sample User Message */}
                <div className="flex justify-end mb-4">
                  <div 
                    className="inline-block rounded-lg py-2 px-3 max-w-xs text-sm"
                    style={{ 
                      backgroundColor: '#f0f0f0',
                      color: '#333333'
                    }}
                  >
                    Hi there! Can you help me?
                  </div>
                </div>
                
                {/* Sample Bot Response */}
                <div className="mb-4">
                  <div 
                    className="inline-block rounded-lg py-2 px-3 max-w-xs text-sm"
                    style={{ 
                      backgroundColor: settings.secondary_color,
                      color: 'white'
                    }}
                  >
                    Of course! I'm here to assist you. What do you need help with today?
                  </div>
                </div>
              </div>
              
              {/* Chat Input */}
              <div 
                className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200"
                style={{ backgroundColor: settings.background_color }}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="w-full py-2 px-3 border rounded-full text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: settings.chat_color,
                      color: settings.text_color,
                      backgroundColor: 'white'
                    }}
                    readOnly
                  />
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full"
                    style={{ backgroundColor: settings.chat_color }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`absolute ${settings.position === 'left' ? 'bottom-4 left-4' : 'bottom-4 right-4'} w-14 h-14 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-300`}
              style={{ backgroundColor: settings.chat_color }}
              onClick={toggleExpand}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
