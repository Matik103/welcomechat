
import { useState } from "react";
import { WidgetSettings } from "@/types/widget-settings";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { MessageCircle } from "lucide-react";

interface WidgetPreviewProps {
  settings: WidgetSettings;
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: settings.welcome_text || "Hi 👋, how can I help?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    setMessages([...messages, { text: inputValue, isUser: true }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          text: "I'm your AI assistant. This is a preview of how the widget will look on your website. In the actual implementation, I'll be able to answer questions based on your knowledge base.", 
          isUser: false 
        }
      ]);
    }, 1000);
    
    setInputValue("");
  };

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 flex justify-end items-end p-4 bg-gray-50">
      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${expanded ? 'w-80 h-96 rounded-lg' : 'w-14 h-14 rounded-full'}
          shadow-lg
          flex flex-col
          overflow-hidden
          ${expanded ? 'bg-white' : `bg-[${settings.chat_color}]`}
        `}
      >
        {expanded ? (
          <>
            <ChatHeader 
              agentName={settings.agent_name} 
              logoUrl={settings.logo_url}
              backgroundColor={settings.chat_color}
              textColor={settings.text_color}
              onClose={handleToggleExpand}
            />
            
            <ChatMessages 
              messages={messages}
              backgroundColor={settings.background_color}
              textColor={settings.text_color}
              secondaryColor={settings.secondary_color}
            />
            
            <ChatInput 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSend={handleSendMessage}
              primaryColor={settings.chat_color}
              secondaryColor={settings.secondary_color}
              textColor={settings.text_color}
            />
          </>
        ) : (
          <button
            onClick={handleToggleExpand}
            style={{ backgroundColor: settings.chat_color }}
            className="w-full h-full flex items-center justify-center text-white"
          >
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.agent_name} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E";
                }}
              />
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </button>
        )}
      </div>
      
      <div className="absolute bottom-3 left-4 text-xs text-gray-500">
        {!expanded && (
          <div className="bg-white p-2 rounded-lg shadow-md animate-pulse">
            Click the button to expand the widget
          </div>
        )}
      </div>
    </div>
  );
}
