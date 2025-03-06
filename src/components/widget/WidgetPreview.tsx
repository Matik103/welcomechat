
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewProps {
  settings: WidgetSettings;
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([
    { type: 'bot', text: settings.welcome_text || "Hi 👋, how can I help?" }
  ]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;
    
    // Add user message
    setChatMessages([...chatMessages, { type: 'user', text: userMessage }]);
    
    // Simulate bot response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: "I'm a demo bot. I'll show how your responses will look to users." 
      }]);
    }, 1000);
    
    setUserMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
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
          <div className="p-3 h-56 overflow-y-auto flex flex-col space-y-4">
            {chatMessages.map((message, index) => (
              <div key={index} className={`${message.type === 'user' ? 'flex justify-end' : ''}`}>
                <div 
                  className={`inline-block rounded-lg py-2 px-3 max-w-xs text-sm ${
                    message.type === 'user' 
                      ? 'bg-gray-100 text-gray-800' 
                      : ''
                  }`}
                  style={message.type === 'bot' ? { 
                    backgroundColor: settings.secondary_color,
                    color: 'white'
                  } : {}}
                >
                  {message.text}
                </div>
                {message.type === 'bot' && (
                  <div 
                    className="text-xs mt-1 opacity-60"
                    style={{ color: settings.text_color }}
                  >
                    {index === 0 ? settings.response_time_text || "I typically respond right away" : ""}
                  </div>
                )}
              </div>
            ))}
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
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full"
                style={{ backgroundColor: settings.chat_color }}
                onClick={handleSendMessage}
              >
                <Send size={16} className="text-white" />
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
  );
}
