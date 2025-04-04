
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
  
  // Handle sending messages
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);
    
    try {
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
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dynamic styles based on widget settings
  const headerBgColor = settings.header_bg_color || '#4F46E5';
  const chatBgColor = settings.chat_bg_color || '#F9FAFB';
  const chatTextColor = settings.chat_text_color || '#1F2937';
  const buttonBgColor = settings.button_bg_color || '#4F46E5';
  const buttonTextColor = settings.button_text_color || '#FFFFFF';

  return (
    <div className="flex flex-col overflow-hidden border rounded-lg shadow-sm bg-white h-[500px]">
      {/* Widget Header */}
      <ChatHeader 
        title={settings.widget_title || "Chat with us"}
        subtitle={settings.widget_subtitle || "We're here to help"}
        logoUrl={settings.logo_url}
        bgColor={headerBgColor}
      />
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ backgroundColor: chatBgColor }}>
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading}
          userBubbleColor={settings.user_bubble_color || '#4F46E5'}
          assistantBubbleColor={settings.assistant_bubble_color || '#F3F4F6'}
          userTextColor={settings.user_text_color || '#FFFFFF'}
          assistantTextColor={settings.assistant_text_color || '#1F2937'}
        />
      </div>
      
      {/* Input Area */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSendMessage}
        placeholder={settings.input_placeholder || "Type your message..."}
        buttonText={settings.send_button_text || "Send"}
        isLoading={isLoading}
        buttonBgColor={buttonBgColor}
        buttonTextColor={buttonTextColor}
      />
    </div>
  );
};
