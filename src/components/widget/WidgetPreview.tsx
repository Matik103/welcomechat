
import { useState, useEffect, useRef } from "react";
import { WidgetSettings } from "@/types/widget-settings";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { MessageCircle, Loader2 } from "lucide-react";
import { useAgentContent } from "@/hooks/useAgentContent";

interface WidgetPreviewProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreview({ settings, clientId }: WidgetPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: settings.welcome_text || "Hi 👋, how can I help?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { agentContent, sources, isLoading: isAgentLoading } = useAgentContent(
    clientId, 
    "" // Use empty string instead of "AI Assistant"
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const typeResponse = (response: string) => {
    setIsTyping(true);
    
    const newMessageIndex = messages.length;
    setMessages(prev => [...prev, { text: "", isUser: false }]);
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < response.length) {
        setMessages(prev => {
          const updated = [...prev];
          updated[newMessageIndex] = { 
            text: response.substring(0, i + 1), 
            isUser: false 
          };
          return updated;
        });
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
    const userQuery = inputValue;
    setInputValue("");
    
    if (clientId) {
      try {
        setIsTyping(true);
        
        const response = await fetch('https://mgjodiqecnnltsgorife.supabase.co/functions/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userQuery,
            agent_name: "",
            client_id: clientId,
            context: agentContent.substring(0, 3000)
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          typeResponse(data.generatedText || "I couldn't generate a response. Please try again.");
        } else {
          simulateResponse(userQuery);
        }
      } catch (error) {
        console.error("Error calling chat API:", error);
        simulateResponse(userQuery);
      }
    } else {
      simulateResponse(userQuery);
    }
  };

  const simulateResponse = (userQuery: string) => {
    setTimeout(() => {
      let responseText = "I'm your AI assistant. This is a preview of how the widget will look on your website.";
      
      if (agentContent && agentContent.length > 0) {
        if (userQuery.toLowerCase().includes("what") && 
            (userQuery.toLowerCase().includes("know") || 
             userQuery.toLowerCase().includes("about") ||
             userQuery.toLowerCase().includes("learn"))) {
          responseText = `Based on the content I have access to, I can help with information about: ${agentContent.substring(0, 150)}...`;
        } else if (userQuery.toLowerCase().includes("help")) {
          responseText = "I can help answer questions based on the documents and websites that have been shared with me. What would you like to know?";
        } else if (userQuery.toLowerCase().includes("document") || userQuery.toLowerCase().includes("information")) {
          const sourceInfo = sources && sources.length > 0 
            ? `I have access to ${sources.length} documents including ${sources[0]?.url || 'various resources'}.` 
            : "I have access to your organization's knowledge base.";
          responseText = `${sourceInfo} How can I help you today?`;
        } else {
          const words = userQuery.toLowerCase().split(' ').filter(w => w.length > 3);
          let relevantContent = agentContent;
          
          for (const word of words) {
            const index = agentContent.toLowerCase().indexOf(word);
            if (index > -1) {
              const start = Math.max(0, index - 100);
              const end = Math.min(agentContent.length, index + 200);
              relevantContent = agentContent.substring(start, end);
              break;
            }
          }
          
          responseText = `Based on the available information, I can tell you that ${relevantContent.substring(0, 150)}...`;
        }
      }
      
      typeResponse(responseText);
    }, 1000);
  };

  // Render the appropriate widget based on the display mode
  const renderWidgetPreview = () => {
    switch(settings.display_mode) {
      case 'inline':
        return renderInlineWidget();
      case 'sidebar':
        return renderSidebarWidget();
      case 'floating':
      default:
        return renderFloatingWidget();
    }
  };

  // Render the floating widget preview
  const renderFloatingWidget = () => {
    return (
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 flex justify-end items-end p-4 bg-gray-50">
        {!expanded && (
          <div className="absolute bottom-16 right-16 text-xs text-gray-500 z-0 pointer-events-none">
            <div className="bg-white p-2 rounded-lg shadow-md animate-pulse">
              Click the chat icon to expand the widget
            </div>
          </div>
        )}
        
        <div 
          className={`
            transition-all duration-300 ease-in-out z-10
            ${expanded ? 'w-80 h-[450px] rounded-lg' : 'w-14 h-14 rounded-full cursor-pointer'}
            shadow-lg
            flex flex-col
            overflow-hidden
          `}
          style={{ backgroundColor: expanded ? settings.background_color : settings.chat_color }}
        >
          {expanded ? (
            <>
              <ChatHeader 
                agentName={settings.agent_name || ""}
                logoUrl={settings.logo_url}
                backgroundColor={settings.chat_color}
                textColor={settings.text_color}
                onClose={handleToggleExpand}
              />
              
              {isAgentLoading && (
                <div className="flex-1 flex items-center justify-center bg-opacity-50 bg-gray-100">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}
              
              {!isAgentLoading && (
                <>
                  <ChatMessages 
                    messages={messages}
                    backgroundColor={settings.background_color}
                    textColor={settings.text_color}
                    secondaryColor={settings.secondary_color}
                    isTyping={isTyping}
                    messagesEndRef={messagesEndRef}
                  />
                  
                  <ChatInput 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onSend={handleSendMessage}
                    primaryColor={settings.chat_color}
                    secondaryColor={settings.secondary_color}
                    textColor={settings.text_color}
                    disabled={isTyping}
                  />
                </>
              )}
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
                  alt="Assistant" 
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
      </div>
    );
  };

  // Render the inline widget preview
  const renderInlineWidget = () => {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 flex flex-col justify-center items-center p-4 bg-gray-50">
        <div className="w-full max-w-[500px] border border-gray-200 rounded-lg overflow-hidden shadow-md bg-white">
          <div className="p-3 flex items-center gap-2" style={{ backgroundColor: settings.chat_color, color: 'white' }}>
            {settings.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Assistant" 
                className="w-6 h-6 object-contain rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E";
                }}
              />
            )}
            <span className="font-medium">{settings.agent_name || 'Chat'}</span>
          </div>
          
          <div className="h-[250px] overflow-y-auto p-3" style={{ backgroundColor: settings.background_color }}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-2 ${message.isUser ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${
                    message.isUser 
                      ? 'bg-indigo-600 text-white' 
                      : `bg-${settings.secondary_color} text-${settings.text_color}`
                  }`}
                  style={{ 
                    backgroundColor: message.isUser ? settings.chat_color : settings.secondary_color,
                    color: message.isUser ? 'white' : settings.text_color
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-left mb-2">
                <div 
                  className="inline-block px-3 py-2 rounded-lg bg-gray-200"
                  style={{ backgroundColor: settings.secondary_color, color: settings.text_color }}
                >
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-2 flex gap-2 border-t" style={{ backgroundColor: settings.secondary_color }}>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-1"
              placeholder="Type your message..."
              disabled={isTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              onClick={handleSendMessage}
              className="px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: settings.chat_color }}
              disabled={isTyping || !inputValue.trim()}
            >
              Send
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Inline chat widget preview</p>
          <p className="text-xs mt-1">This widget will appear directly in your webpage content</p>
        </div>
      </div>
    );
  };

  // Render the sidebar widget preview
  const renderSidebarWidget = () => {
    return (
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center p-4 bg-gray-50">
        <div 
          className={`
            absolute top-0 ${settings.position === 'left' ? 'left-0' : 'right-0'} h-full
            transition-all duration-300 ease-in-out 
            ${expanded ? 'w-80' : 'w-12'}
            shadow-lg flex flex-col
            overflow-hidden
            border-${settings.position === 'left' ? 'r' : 'l'} border-gray-200
          `}
          style={{ backgroundColor: settings.background_color }}
        >
          {/* Tab */}
          <div 
            className={`absolute top-1/2 transform -translate-y-1/2 ${
              settings.position === 'left' ? 'right-[-40px]' : 'left-[-40px]'
            } w-10 h-20 flex items-center justify-center cursor-pointer rounded-${
              settings.position === 'left' ? 'r' : 'l'
            }-lg`}
            style={{ backgroundColor: settings.chat_color }}
            onClick={handleToggleExpand}
          >
            <MessageCircle className="text-white" />
          </div>
          
          {expanded && (
            <>
              <div 
                className="p-3 flex items-center gap-2" 
                style={{ backgroundColor: settings.chat_color, color: 'white' }}
              >
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Assistant" 
                    className="w-6 h-6 object-contain rounded-full"
                  />
                )}
                <span className="font-medium">{settings.agent_name || 'Chat'}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-2 ${message.isUser ? 'text-right' : 'text-left'}`}
                  >
                    <div 
                      className={`inline-block px-3 py-2 rounded-lg max-w-[80%]`}
                      style={{ 
                        backgroundColor: message.isUser ? settings.chat_color : settings.secondary_color,
                        color: message.isUser ? 'white' : settings.text_color
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-left mb-2">
                    <div 
                      className="inline-block px-3 py-2 rounded-lg"
                      style={{ backgroundColor: settings.secondary_color, color: settings.text_color }}
                    >
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-2 flex gap-2 border-t" style={{ backgroundColor: settings.secondary_color }}>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-1"
                  placeholder="Type your message..."
                  disabled={isTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: settings.chat_color }}
                  disabled={isTyping || !inputValue.trim()}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
        
        {!expanded && (
          <div className="text-sm text-gray-500 text-center">
            <p>Sidebar chat widget preview</p>
            <p className="text-xs mt-1">Click the tab on the {settings.position} to expand</p>
          </div>
        )}
      </div>
    );
  };

  return renderWidgetPreview();
}
