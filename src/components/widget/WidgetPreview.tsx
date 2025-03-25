import { useState, useEffect, useRef } from "react";
import { WidgetSettings } from "@/types/widget-settings";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { MessageCircle, Loader2, AlertCircle } from "lucide-react";
import { useChatPreview } from "@/hooks/useChatPreview";

interface WidgetPreviewProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreview({ settings, clientId }: WidgetPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const effectiveClientId = clientId || 'test-client-id';
  if (!clientId) {
    console.warn('No client ID provided to WidgetPreview, using test-client-id as fallback');
  }

  const {
    messages: chatMessages,
    isLoading,
    error,
    sendMessage,
    clearChat
  } = useChatPreview(effectiveClientId);

  const displayMessages = [
    { text: settings.welcome_text || "Hi 👋, how can I help?", isUser: false },
    ...(Array.isArray(chatMessages) ? chatMessages.map(msg => ({
      text: msg.content,
      isUser: msg.role === 'user'
    })) : [])
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue("");
    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Error sending message:', err);
      // The error will be handled by the useChatPreview hook
    }
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-opacity-50 bg-gray-100 p-4">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-center text-red-500 text-sm">{error}</p>
      </div>
    );
  };

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
              
              {isLoading && (
                <div className="flex-1 flex items-center justify-center bg-opacity-50 bg-gray-100">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              )}
              
              {error && renderError()}
              
              {!isLoading && !error && (
                <>
                  <ChatMessages 
                    messages={displayMessages}
                    backgroundColor={settings.background_color}
                    textColor={settings.text_color}
                    secondaryColor={settings.secondary_color}
                    isTyping={false}
                    messagesEndRef={messagesEndRef}
                  />
                  
                  <ChatInput 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onSend={handleSendMessage}
                    primaryColor={settings.chat_color}
                    secondaryColor={settings.secondary_color}
                    textColor={settings.text_color}
                    disabled={isLoading}
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
            {error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                <p className="text-center text-red-500 text-sm">{error}</p>
              </div>
            ) : (
              <>
                {displayMessages.map((message, index) => (
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
                {isLoading && (
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
              </>
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
              disabled={isLoading || !!error}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              onClick={handleSendMessage}
              className="px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: settings.chat_color }}
              disabled={isLoading || !inputValue.trim() || !!error}
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
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E";
                    }}
                  />
                )}
                <span className="font-medium">{settings.agent_name || 'Chat'}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {error ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
                    <p className="text-center text-red-500 text-sm">{error}</p>
                  </div>
                ) : (
                  <>
                    {displayMessages.map((message, index) => (
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
                    {isLoading && (
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
                  </>
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
                  disabled={isLoading || !!error}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: settings.chat_color }}
                  disabled={isLoading || !inputValue.trim() || !!error}
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
