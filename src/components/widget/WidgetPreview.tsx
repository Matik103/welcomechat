
import { useState, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";

interface WidgetPreviewProps {
  settings: WidgetSettings;
}

export function WidgetPreview({ settings }: WidgetPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'bot', text: string}>>([
    { type: 'bot', text: settings.welcome_text || "Hi 👋, how can I help?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [iconSize, setIconSize] = useState<'normal' | 'medium' | 'large'>('normal'); // Icon size state
  
  // Get the Supabase project reference from the URL
  const projectRef = SUPABASE_URL.split("https://")[1]?.split(".supabase.co")[0];
  
  // Update welcome message when settings change
  useEffect(() => {
    if (chatMessages.length === 1 && chatMessages[0].type === 'bot') {
      setChatMessages([{ type: 'bot', text: settings.welcome_text || "Hi 👋, how can I help?" }]);
    }
  }, [settings.welcome_text]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;
    
    // Add user message
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    
    // Store the user message to clear input field
    const currentMessage = userMessage;
    setUserMessage("");
    setIsLoading(true);
    
    try {
      let responseText = "";
      const startTime = Date.now();

      // Try to query the ai_agents table first using similarity search if available
      if (settings.agent_name) {
        try {
          // Get the client ID - we need to work with the current auth session
          const { data: { session } } = await supabase.auth.getSession();
          const clientId = session?.user?.id || session?.user?.user_metadata?.client_id;
          
          if (clientId) {
            console.log(`Searching ai_agents for client: ${clientId}, agent: ${settings.agent_name}`);
            
            // First check if the agent has any entries
            const { count, error: countError } = await supabase
              .from('ai_agents')
              .select('*', { count: 'exact', head: true })
              .eq('client_id', clientId)
              .eq('name', settings.agent_name);
              
            if (countError) {
              console.error("Error checking ai_agents:", countError);
            } else if (count && count > 0) {
              // If we have entries in ai_agents, query those first
              console.log(`Found ${count} entries in ai_agents, performing similarity search`);
              
              // Generate the embedding for current message
              const embedding = await generateEmbedding(currentMessage);
              
              // Convert embedding array to string for Supabase RPC call
              const embeddingString = JSON.stringify(embedding);
              
              // Execute the match_ai_agents RPC with the current message
              const { data: matches, error: matchError } = await supabase.rpc(
                'match_ai_agents',
                {
                  client_id_param: clientId,
                  agent_name_param: settings.agent_name,
                  query_embedding: embeddingString,
                  match_count: 5
                }
              );
              
              if (matchError) {
                console.error("Error searching ai_agents:", matchError);
              } else if (matches && matches.length > 0) {
                console.log("AI agent matches:", matches);
                
                // Format context from matches
                const context = matches
                  .map(match => match.content)
                  .join("\n\n");
                
                // Use context to enhance response
                responseText = await generateAIResponse(currentMessage, context, settings.agent_name);
                
                // Log the interaction to ai_agents
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                await supabase.rpc('log_chat_interaction', {
                  client_id_param: clientId,
                  agent_name_param: settings.agent_name,
                  query_text_param: currentMessage,
                  response_text_param: responseText,
                  response_time_ms_param: responseTime,
                  settings_json: {
                    source: 'widget_preview',
                    similarity_matches: matches.length
                  }
                });
                
                // If we got a response, add it to chat and return
                setChatMessages(prev => [...prev, { type: 'bot', text: responseText }]);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (searchError) {
          console.error("Error during ai_agents search:", searchError);
        }
      }
      
      // Fall back to webhook or edge function if ai_agents search fails or has no results
      const endpointUrl = settings.webhook_url || `https://${projectRef}.supabase.co/functions/v1/chat`;
      
      console.log(`Falling back to endpoint: ${endpointUrl}`);
      console.log("Payload:", { 
        prompt: currentMessage,
        agent_name: settings.agent_name || "AI Assistant",
        webhook_url: settings.webhook_url // Pass the webhook URL through for potential forwarding
      });
      
      // Make the API call to the webhook or Supabase edge function
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: currentMessage,
          agent_name: settings.agent_name || "AI Assistant",
          webhook_url: settings.webhook_url // Pass this through so the edge function can use it
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("API response:", data);
        
        responseText = data.generatedText || data.response || data.message || 
                    "I'm your AI assistant. How can I help you today?";
                    
        // Add bot response
        setChatMessages(prev => [...prev, { type: 'bot', text: responseText }]);
      } else {
        const errorData = await response.text();
        console.error(`API error (${response.status}):`, errorData);
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: "Sorry, I couldn't process your request. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate embeddings for the query text
  const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-ada-002"
        })
      });
      
      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      // Return a zero vector as fallback
      return Array(1536).fill(0);
    }
  };

  // Generate AI response using the context
  const generateAIResponse = async (query: string, context: string, agentName: string): Promise<string> => {
    try {
      // Use the chat endpoint from Supabase function
      const response = await fetch(`https://${projectRef}.supabase.co/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: query,
          agent_name: agentName,
          context: context
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI response error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.generatedText || data.response || data.message || 
            "I'm your AI assistant. How can I help you today?";
    } catch (error) {
      console.error("Error generating AI response:", error);
      return "I'm having trouble accessing my knowledge base right now. Could you try again later?";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cycle through icon sizes when double-clicked
  const cycleIconSize = (e: React.MouseEvent) => {
    // Only change size if chat is not expanded
    if (!isExpanded) {
      e.stopPropagation(); // Prevent toggling expanded state
      if (iconSize === 'normal') {
        setIconSize('medium');
      } else if (iconSize === 'medium') {
        setIconSize('large');
      } else {
        setIconSize('normal');
      }
    }
  };

  // Get icon size in pixels based on the current size state
  const getIconSize = () => {
    switch (iconSize) {
      case 'medium': return 38;
      case 'large': return 46;
      default: return 30;
    }
  };

  // Get button size in pixels based on the current icon size
  const getButtonSize = () => {
    switch (iconSize) {
      case 'medium': return 70;
      case 'large': return 80;
      default: return 60;
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
          style={{ backgroundColor: settings.background_color || '#ffffff' }}
        >
          {/* Chat Header */}
          <div 
            className="p-3 flex items-center justify-between"
            style={{ backgroundColor: settings.chat_color || '#854fff' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.secondary_color || '#6b3fd4' }}
              >
                <Bot size={14} className="text-white" />
              </div>
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
            style={{ color: settings.text_color || '#333333' }}
          >
            {chatMessages.map((message, index) => (
              <div key={index} className={`${message.type === 'user' ? 'flex justify-end' : ''} animate-in fade-in-50 duration-300`}>
                <div className="flex items-start gap-2 max-w-[85%]">
                  {message.type === 'bot' && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: settings.secondary_color || '#6b3fd4' }}
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
                      backgroundColor: settings.secondary_color || '#6b3fd4',
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
                    style={{ color: settings.text_color || '#333333' }}
                  >
                    {settings.response_time_text || "I typically respond right away"}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-3 border-t"
            style={{ 
              backgroundColor: settings.background_color || '#ffffff',
              borderColor: `${settings.chat_color || '#854fff'}20`
            }}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full py-2 px-3 pr-10 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  borderColor: `${settings.chat_color || '#854fff'}50`,
                  color: settings.text_color || '#333333',
                  backgroundColor: 'white',
                }}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full disabled:opacity-50"
                style={{ backgroundColor: settings.chat_color || '#854fff' }}
                onClick={handleSendMessage}
                disabled={isLoading || !userMessage.trim()}
                aria-label="Send message"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div 
            className={`absolute ${settings.position === 'left' ? 'bottom-4 left-4' : 'bottom-4 right-4'} 
              rounded-full shadow-lg flex items-center justify-center cursor-pointer 
              hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 group`}
            style={{ 
              backgroundColor: settings.chat_color || '#854fff',
              width: `${getButtonSize()}px`,
              height: `${getButtonSize()}px`
            }}
            onClick={toggleExpand}
            onDoubleClick={cycleIconSize}
          >
            <span 
              className="text-white transition-all duration-300"
              style={{ 
                fontSize: `${getIconSize()}px`,
                lineHeight: 1
              }}
            >
              💬
            </span>
            
            <div className="absolute -top-10 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Double-click to resize
            </div>
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-xs">
            Current icon size: {iconSize} ({getIconSize()}px)
          </div>
        </div>
      )}
    </div>
  );
}
