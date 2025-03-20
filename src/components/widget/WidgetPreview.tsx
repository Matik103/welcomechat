
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
  
  // Fetch agent content for preview responses
  const { agentContent, sources, isLoading: isAgentLoading } = useAgentContent(
    clientId, 
    "" // Use an empty string instead of fixed value
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

  // Simulate a typing effect for responses
  const typeResponse = (response: string) => {
    setIsTyping(true);
    
    // Add an empty message that will be filled character by character
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
    }, 15); // typing speed - adjust as needed
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Add user message
    setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
    const userQuery = inputValue;
    setInputValue("");
    
    // If we have a client ID, try to make a real request to our API
    if (clientId) {
      try {
        // Show typing indicator
        setIsTyping(true);
        
        // Call the OpenAI-powered chat function
        const response = await fetch('https://mgjodiqecnnltsgorife.supabase.co/functions/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: userQuery,
            agent_name: "", // Use empty string instead of fixed value
            client_id: clientId,
            context: agentContent.substring(0, 3000) // Send first 3000 chars as context
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Use typing effect for the response
          typeResponse(data.generatedText || "I couldn't generate a response. Please try again.");
        } else {
          // Fallback to simulated response if API call fails
          simulateResponse(userQuery);
        }
      } catch (error) {
        console.error("Error calling chat API:", error);
        // Fallback to simulated response
        simulateResponse(userQuery);
      }
    } else {
      // No client ID, use simulated response
      simulateResponse(userQuery);
    }
  };
  
  const simulateResponse = (userQuery: string) => {
    // Use agent content to create a more realistic preview
    setTimeout(() => {
      let responseText = "I'm your AI assistant. This is a preview of how the widget will look on your website.";
      
      // If we have agent content, use it to create a more realistic preview
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
          // Find a relevant snippet from the agent content
          const words = userQuery.toLowerCase().split(' ').filter(w => w.length > 3);
          let relevantContent = agentContent;
          
          // Try to find a relevant section based on the query
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
      
      // Use typing effect for the response
      typeResponse(responseText);
    }, 1000);
  };

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
              agentName=""  
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
                alt="Chat Widget" 
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
}
