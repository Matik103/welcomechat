
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { WidgetSettings } from '@/types/widget-settings';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WidgetPreviewProps {
  settings: WidgetSettings;
  clientId: string;
  onTestInteraction?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const WidgetPreview = ({ 
  settings, 
  clientId,
  onTestInteraction
}: WidgetPreviewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle sending messages
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      // Call webhook function
      const { data, error } = await supabase.functions.invoke('query-openai-assistant', {
        body: {
          client_id: clientId,
          query: userMessage
        }
      });

      if (error) throw error;

      // Handle the response based on its format
      if (typeof data === 'string') {
        setMessages(prev => [...prev, { role: 'assistant', content: data }]);
      } else if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        const assistantMessage = data.messages[data.messages.length - 1]?.content || 
          "Sorry, I couldn't generate a response.";
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Sorry, I couldn't generate a response." 
        }]);
      }

      // Log the interaction if callback provided
      if (onTestInteraction) {
        onTestInteraction();
      }
    } catch (error) {
      console.error('Error querying assistant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to get response: ${errorMessage}`);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dynamic styles based on widget settings
  const headerBgColor = settings.chat_color || '#4F46E5';
  const chatBgColor = settings.background_color || '#F9FAFB';
  const chatTextColor = settings.text_color || '#1F2937';
  const buttonBgColor = settings.button_color || '#4F46E5';
  const buttonTextColor = settings.chat_font_color || '#FFFFFF';

  // Transform messages to match ChatMessages expected format
  const formattedMessages = messages.map(msg => ({
    text: msg.content,
    isUser: msg.role === 'user'
  }));

  if (error) {
    console.log('Widget preview error:', error);
  }

  // Render different preview based on display mode
  switch (settings.display_mode) {
    case 'inline':
      return (
        <div className="w-full border rounded-lg bg-white overflow-hidden shadow-sm">
          <ChatHeader 
            headerTitle={settings.agent_name || "Chat with us"}
            headerSubtitle={settings.welcome_text || "We're here to help"}
            logoUrl={settings.logo_url}
            headerBgColor={headerBgColor}
          />
          
          {error && (
            <Alert variant="destructive" className="m-3 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="h-[300px] overflow-y-auto p-3 space-y-4" style={{ backgroundColor: chatBgColor }}>
            <ChatMessages 
              messages={formattedMessages} 
              isLoading={isLoading}
              userBubbleColor={settings.chat_color || '#4F46E5'}
              assistantBubbleColor={settings.secondary_color || '#F3F4F6'}
              userTextColor={'#FFFFFF'}
              assistantTextColor={chatTextColor}
            />
          </div>
          
          <ChatInput
            value={inputValue}
            onChange={(val) => setInputValue(val)}
            onSubmit={handleSendMessage}
            placeholder={settings.greeting_message || "Type your message..."}
            buttonText={settings.button_text || "Send"}
            isLoading={isLoading}
            buttonBgColor={buttonBgColor}
            buttonTextColor={buttonTextColor}
          />
        </div>
      );
      
    case 'sidebar':
      return (
        <div className="flex h-[500px] border rounded-lg shadow-sm">
          {/* Sidebar tab */}
          <div 
            className="w-8 flex items-center justify-center writing-vertical"
            style={{ backgroundColor: headerBgColor, color: '#FFFFFF' }}
          >
            <div className="transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
              {settings.agent_name || "Chat with us"}
            </div>
          </div>
          
          {/* Chat content */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <ChatHeader 
              headerTitle={settings.agent_name || "Chat with us"}
              headerSubtitle={settings.welcome_text || "We're here to help"}
              logoUrl={settings.logo_url}
              headerBgColor={headerBgColor}
            />
            
            {error && (
              <Alert variant="destructive" className="m-3 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ backgroundColor: chatBgColor }}>
              <ChatMessages 
                messages={formattedMessages} 
                isLoading={isLoading}
                userBubbleColor={settings.chat_color || '#4F46E5'}
                assistantBubbleColor={settings.secondary_color || '#F3F4F6'}
                userTextColor={'#FFFFFF'}
                assistantTextColor={chatTextColor}
              />
            </div>
            
            <ChatInput
              value={inputValue}
              onChange={(val) => setInputValue(val)}
              onSubmit={handleSendMessage}
              placeholder={settings.greeting_message || "Type your message..."}
              buttonText={settings.button_text || "Send"}
              isLoading={isLoading}
              buttonBgColor={buttonBgColor}
              buttonTextColor={buttonTextColor}
            />
          </div>
        </div>
      );

    case 'floating':
    default:
      return (
        <div className="relative h-[550px] bg-gray-100 rounded-lg p-4">
          {/* Floating chat bubble */}
          <div className="absolute bottom-4 right-4 flex flex-col items-end">
            {/* Collapsed bubble state */}
            {messages.length === 0 && (
              <div className="mb-3">
                <button 
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-md shadow-md text-white"
                  style={{ backgroundColor: headerBgColor }}
                  onClick={() => setMessages([{ role: 'assistant', content: settings.greeting_message || "Hello! How can I help you today?" }])}
                >
                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="Chat" className="w-6 h-6 rounded-full" />
                  )}
                  <span>{settings.button_text || "Chat with Us"}</span>
                </button>
              </div>
            )}
            
            {/* Expanded chat state */}
            {messages.length > 0 && (
              <div className="w-[350px] h-[450px] flex flex-col overflow-hidden border rounded-lg shadow-lg bg-white">
                <ChatHeader 
                  headerTitle={settings.agent_name || "Chat with us"}
                  headerSubtitle={settings.welcome_text || "We're here to help"}
                  logoUrl={settings.logo_url}
                  headerBgColor={headerBgColor}
                />
                
                {error && (
                  <Alert variant="destructive" className="m-3 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ backgroundColor: chatBgColor }}>
                  <ChatMessages 
                    messages={formattedMessages} 
                    isLoading={isLoading}
                    userBubbleColor={settings.chat_color || '#4F46E5'}
                    assistantBubbleColor={settings.secondary_color || '#F3F4F6'}
                    userTextColor={'#FFFFFF'}
                    assistantTextColor={chatTextColor}
                  />
                </div>
                
                <ChatInput
                  value={inputValue}
                  onChange={(val) => setInputValue(val)}
                  onSubmit={handleSendMessage}
                  placeholder={settings.greeting_message || "Type your message..."}
                  buttonText={settings.button_text || "Send"}
                  isLoading={isLoading}
                  buttonBgColor={buttonBgColor}
                  buttonTextColor={buttonTextColor}
                />
              </div>
            )}
          </div>
        </div>
      );
  }
};

