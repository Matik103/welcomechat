
import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
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
  
  // Update welcome message when settings change
  useEffect(() => {
    if (chatMessages.length === 1 && chatMessages[0].type === 'bot') {
      setChatMessages([{ type: 'bot', text: settings.welcome_text || "Hi 👋, how can I help?" }]);
    }
  }, [settings.welcome_text]);

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
        text: "I'm a demo bot. This is how your responses will look to users." 
      }]);
    }, 800);
    
    setUserMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative border border-gray-200 rounded-md p-4 h-[420px] bg-gray-50">
      <div className="absolute top-0 left-0 right-0 p-3 bg-gray-100 text-sm text-gray-500 rounded-t-md text-center">
        Your website
      </div>

      {isExpanded ? (
        <div 
          className="absolute bottom-4 right-4 sm:w-80 w-72 sm:h-96 h-80 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out transform scale-100"
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
              <span className="font-medium text-sm text-white truncate">
                {settings.agent_name || "AI Assistant"}
              </span>
            </div>
            <button 
              onClick={toggleExpand}
              className="text-white hover:bg-white/10 p-1 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Chat Body */}
          <div 
            className="p-3 h-64 overflow-y-auto flex flex-col space-y-4"
            style={{ color: settings.text_color }}
          >
            {chatMessages.map((message, index) => (
              <div key={index} className={`${message.type === 'user' ? 'flex justify-end' : ''} animate-in fade-in-50 duration-300`}>
                <div className="flex items-start gap-2 max-w-[85%]">
                  {message.type === 'bot' && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: settings.secondary_color }}
                    >
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div 
                    className={`rounded-lg py-2 px-3 text-sm break-words ${
                      message.type === 'user' 
                        ? 'bg-gray-100 text-gray-800 ml-auto' 
                        : ''
                    }`}
                    style={message.type === 'bot' ? { 
                      backgroundColor: settings.secondary_color,
                      color: 'white'
                    } : {}}
                  >
                    {message.text}
                  </div>
                  {message.type === 'user' && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200 mt-1"
                    >
                      <User size={14} className="text-gray-600" />
                    </div>
                  )}
                </div>
                {message.type === 'bot' && index === 0 && (
                  <div 
                    className="text-xs mt-1 opacity-60"
                    style={{ color: settings.text_color }}
                  >
                    {settings.response_time_text || "I typically respond right away"}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-3 border-t"
            style={{ 
              backgroundColor: settings.background_color,
              borderColor: `${settings.chat_color}20`
            }}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full py-2 px-3 pr-10 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  borderColor: `${settings.chat_color}50`,
                  color: settings.text_color,
                  backgroundColor: 'white',
                  // Fixing the focusRing error - replace with CSS class instead of inline style
                }}
                className="w-full py-2 px-3 pr-10 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                // Add a custom class to handle the focus ring color
                style={{ 
                  borderColor: `${settings.chat_color}50`,
                  color: settings.text_color,
                  backgroundColor: 'white'
                }}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full"
                style={{ backgroundColor: settings.chat_color }}
                onClick={handleSendMessage}
                aria-label="Send message"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`absolute ${settings.position === 'left' ? 'bottom-4 left-4' : 'bottom-4 right-4'} w-16 h-16 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
          style={{ backgroundColor: settings.chat_color }}
          onClick={toggleExpand}
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
      )}
    </div>
  );
}
