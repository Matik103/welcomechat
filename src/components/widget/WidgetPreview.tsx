import { useState, useEffect, useRef } from "react";
import { WidgetSettings } from "@/types/widget-settings";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { MessageCircle, Loader2, Bot, User } from "lucide-react";
import { useAgentContent } from "@/hooks/useAgentContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [conversationContext, setConversationContext] = useState<{
    userPreferences?: Record<string, string>;
    userName?: string;
    previousTopics?: string[];
    lastQuestion?: string;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { agentContent, sources, isLoading: isAgentLoading } = useAgentContent(
    clientId, 
    settings.agent_name || ""
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!previewLoaded) {
        console.log("Forcing preview loaded state after timeout");
        setPreviewLoaded(true);
        setIsInitialized(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [previewLoaded]);

  useEffect(() => {
    if (clientId) {
      console.log("WidgetPreview mounted with clientId:", clientId);
    }
    
    if (!isAgentLoading || previewLoaded) {
      setIsInitialized(true);
    }
    
    const loadTimer = setTimeout(() => {
      setPreviewLoaded(true);
    }, 1500);
    
    return () => clearTimeout(loadTimer);
  }, [clientId, isAgentLoading, previewLoaded]);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const typeResponse = (response: string) => {
    setIsTyping(true);
    
    setMessages(prev => [...prev, { text: response, isUser: false }]);
    
    const typingTime = Math.min(response.length * 10, 2000);
    setTimeout(() => {
      setIsTyping(false);
    }, typingTime);
  };

  const updateConversationContext = (userQuery: string, response: string) => {
    const newContext = { ...conversationContext };
    
    newContext.lastQuestion = userQuery;
    
    if (!newContext.previousTopics) {
      newContext.previousTopics = [];
    }
    newContext.previousTopics.push(userQuery);
    
    if (!newContext.userName && userQuery.toLowerCase().includes("my name is")) {
      const nameParts = userQuery.match(/my name is\s+([a-zA-Z]+)/i);
      if (nameParts && nameParts[1]) {
        newContext.userName = nameParts[1];
      }
    }
    
    if (!newContext.userPreferences) {
      newContext.userPreferences = {};
    }
    
    if (userQuery.toLowerCase().includes("like") || userQuery.toLowerCase().includes("prefer")) {
      const likesMatch = userQuery.match(/(?:like|prefer|love)\s+([a-zA-Z\s]+)/i);
      if (likesMatch && likesMatch[1]) {
        newContext.userPreferences[likesMatch[1].trim()] = "likes";
      }
    }
    
    if (userQuery.toLowerCase().includes("don't like") || userQuery.toLowerCase().includes("hate")) {
      const dislikesMatch = userQuery.match(/(?:don't like|hate|dislike)\s+([a-zA-Z\s]+)/i);
      if (dislikesMatch && dislikesMatch[1]) {
        newContext.userPreferences[dislikesMatch[1].trim()] = "dislikes";
      }
    }
    
    setConversationContext(newContext);
    console.log("Updated conversation context:", newContext);
    
    return newContext;
  };

  const personalizeResponse = (baseResponse: string, context: typeof conversationContext) => {
    let response = baseResponse;
    
    if (context.userName && !response.includes(context.userName)) {
      if (response.includes("?") || response.includes("!")) {
        response = response.replace(/([?.!])\s+/, `$1 ${context.userName}, `);
      } else if (!response.includes(context.userName)) {
        response = `${context.userName}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
      }
    }
    
    if (context.userPreferences && Object.keys(context.userPreferences).length > 0) {
      for (const [pref, sentiment] of Object.entries(context.userPreferences)) {
        if (baseResponse.toLowerCase().includes(pref.toLowerCase())) {
          if (sentiment === "likes") {
            response += ` I remember you mentioned you like ${pref}!`;
          } else {
            response += ` I recall you weren't a fan of ${pref}.`;
          }
          break;
        }
      }
    }
    
    if (context.lastQuestion && context.lastQuestion !== context.previousTopics?.slice(-1)[0]) {
      if (response.length < 100) {
        response += ` Going back to our earlier conversation about "${context.lastQuestion.substring(0, 30)}...", would you like to continue discussing that?`;
      }
    }
    
    return response;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userQuery = inputValue;
    setInputValue("");
    
    setMessages(prev => [...prev, { text: userQuery, isUser: true }]);
    
    if (isConversationalQuery(userQuery)) {
      handleConversationalQuery(userQuery);
      return;
    }
    
    if (clientId) {
      try {
        setIsTyping(true);
        
        const documentTitles = sources
          .filter(s => s.title)
          .map(s => s.title)
          .join(", ");
        
        const contextHeader = sources.length > 0 
          ? `The following information is from ${sources.length} documents including: ${documentTitles}.\n\n` 
          : "";
        
        const fullContext = contextHeader + (agentContent || "").substring(0, 3000);
        
        console.log("Sending chat request with context length:", fullContext.length);
        
        const response = await fetch('https://mgjodiqecnnltsgorife.supabase.co/functions/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userQuery,
            agent_name: settings.agent_name || "",
            client_id: clientId,
            context: fullContext
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          let generatedText = convertToFirstPerson(data.generatedText || "I couldn't generate a response. Please try again.");
          
          const context = updateConversationContext(userQuery, generatedText);
          
          generatedText = personalizeResponse(generatedText, context);
          
          typeResponse(generatedText);
        } else {
          console.error("Error calling chat API:", await response.text());
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

  const isConversationalQuery = (query: string): boolean => {
    const conversationalPatterns = [
      /how are you/i,
      /what('s| is) your name/i,
      /who are you/i,
      /tell me about yourself/i,
      /^hi\b/i,
      /^hello\b/i,
      /^hey\b/i,
      /good (morning|afternoon|evening)/i
    ];
    
    return conversationalPatterns.some(pattern => pattern.test(query));
  };

  const handleConversationalQuery = (query: string) => {
    let responseText = "";
    
    if (/how are you/i.test(query)) {
      responseText = `I'm doing great today! Thank you for asking. As part of the ${settings.agent_name || "team"}, I'm always ready to help. How about yourself?`;
    } 
    else if (/what('s| is) your name/i.test(query) || /who are you/i.test(query)) {
      responseText = `My name is ${settings.agent_name || "AI Assistant"}! I'm part of our team and I'm here to help you today. What can I assist you with today?`;
    }
    else if (/tell me about yourself/i.test(query)) {
      responseText = `I'm ${settings.agent_name || "your assistant"}, and I work with our team to provide support and information. I have access to our company information and can assist with any questions you might have about our products, services, or anything else you need. What would you like to know about what we offer?`;
    }
    else if (/^(hi|hello|hey)\b/i.test(query) || /good (morning|afternoon|evening)/i.test(query)) {
      responseText = `Hello there! It's great to connect with you today. I'm ${settings.agent_name || "your assistant"} from the team. How can we help you today?`;
    }
    
    const context = updateConversationContext(query, responseText);
    
    responseText = personalizeResponse(responseText, context);
    
    typeResponse(responseText);
  };

  const convertToFirstPerson = (text: string): string => {
    return text
      .replace(/the company('s)?/gi, 'our team$1')
      .replace(/they (are|have|will)/gi, 'we $1')
      .replace(/their/gi, 'our')
      .replace(/them/gi, 'us')
      .replace(/([^a-zA-Z0-9])the team('s)?/gi, '$1our team$2')
      .replace(/(your|this) company/gi, 'our team')
      .replace(/company('s| is| has)/gi, 'we$1')
      .replace(/company will/gi, 'we will')
      .replace(/the business/gi, 'our business')
      .replace(/it offers/gi, 'we offer')
      .replace(/it provides/gi, 'we provide')
      .replace(/it has/gi, 'we have');
  };

  const simulateResponse = (userQuery: string) => {
    setTimeout(() => {
      let responseText = "";
      
      if (userQuery.toLowerCase().includes("help")) {
        responseText = "I can help answer questions based on our information. What would you like to know?";
      } else if (userQuery.toLowerCase().includes("how are you")) {
        responseText = `I'm doing great! How can I help you today?`;
      } else if (agentContent && agentContent.length > 0) {
        responseText = `Based on our information, I'd be happy to help with your question about "${userQuery.substring(0, 30)}...". What specific details would you like to know?`;
      } else {
        responseText = `Thanks for your message! I'm ${settings.agent_name || "your assistant"} from the team. How can I help you today?`;
      }
      
      const context = updateConversationContext(userQuery, responseText);
      responseText = personalizeResponse(responseText, context);
      
      typeResponse(responseText);
    }, 300);
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
          onClick={!expanded ? handleToggleExpand : undefined}
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
                    logoUrl={settings.logo_url}
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
            <div
              className="w-full h-full flex items-center justify-center text-white"
            >
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Assistant" 
                  className="w-8 h-8 object-contain rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <MessageCircle className="w-6 h-6" />
              )}
            </div>
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
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage 
                  src={settings.logo_url} 
                  alt={settings.agent_name || "Assistant"}
                  onError={(e) => {
                    console.error("Error loading logo in inline widget:", e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-primary/10 text-white text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <span className="font-medium">{settings.agent_name || 'Chat'}</span>
          </div>
          
          <div className="h-[250px] overflow-y-auto p-3" style={{ backgroundColor: settings.background_color }}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-3 flex items-start ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <Avatar className="mr-2 h-6 w-6 flex-shrink-0">
                    <AvatarImage 
                      src={settings.logo_url} 
                      alt="Assistant" 
                      onError={(e) => {
                        console.error("Error loading logo in inline message:", e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div 
                  className={`inline-block px-3 py-2 rounded-lg max-w-[80%]`}
                  style={{ 
                    backgroundColor: message.isUser ? settings.chat_color : settings.secondary_color,
                    color: message.isUser ? 'white' : settings.text_color
                  }}
                >
                  {message.text}
                </div>
                
                {message.isUser && (
                  <Avatar className="ml-2 h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start mb-3">
                <Avatar className="mr-2 h-6 w-6 flex-shrink-0">
                  <AvatarImage 
                    src={settings.logo_url} 
                    alt="Assistant" 
                    onError={(e) => {
                      console.error("Error loading logo in inline typing:", e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="inline-block px-3 py-2 rounded-lg bg-gray-100"
                  style={{ color: settings.text_color }}
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
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Assistant" 
                className="w-6 h-6 object-contain rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E";
                }}
              />
            ) : (
              <MessageCircle className="text-white" />
            )}
          </div>
          
          {expanded && (
            <>
              <div 
                className="p-3 flex items-center gap-2" 
                style={{ backgroundColor: settings.chat_color, color: 'white' }}
              >
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage 
                    src={settings.logo_url} 
                    alt={settings.agent_name || "Assistant"}
                    onError={(e) => {
                      console.error("Error loading logo in sidebar header:", e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-primary/10 text-white text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{settings.agent_name || 'Chat'}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-3 flex items-start ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isUser && (
                      <Avatar className="mr-2 h-6 w-6 flex-shrink-0">
                        <AvatarImage 
                          src={settings.logo_url} 
                          alt="Assistant"
                          onError={(e) => {
                            console.error("Error loading logo in sidebar message:", e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div 
                      className={`inline-block px-3 py-2 rounded-lg max-w-[80%]`}
                      style={{ 
                        backgroundColor: message.isUser ? settings.chat_color : settings.secondary_color,
                        color: message.isUser ? 'white' : settings.text_color
                      }}
                    >
                      {message.text}
                    </div>
                    
                    {message.isUser && (
                      <Avatar className="ml-2 h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start mb-3">
                    <Avatar className="mr-2 h-6 w-6 flex-shrink-0">
                      <AvatarImage 
                        src={settings.logo_url} 
                        alt="Assistant"
                        onError={(e) => {
                          console.error("Error loading logo in sidebar typing:", e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
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

  const showLoading = (isAgentLoading && !isInitialized && !previewLoaded);

  return showLoading ? (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading preview...</p>
      </div>
    </div>
  ) : renderWidgetPreview();
}
