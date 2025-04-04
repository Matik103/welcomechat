import React, { useState, useEffect, useRef } from 'react';
import { WidgetSettings } from '@/types/widget-settings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Loader2 } from 'lucide-react';
import { generateAnswerFromDocuments } from '@/utils/documentEmbeddings';
import { supabase } from '@/integrations/supabase/client';

interface WidgetPreviewProps {
  settings: WidgetSettings;
  clientId: string;
  onTestInteraction?: () => Promise<void>;
}

export function WidgetPreview({ settings, clientId, onTestInteraction }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const isInitialized = useRef(false);

  // Initialize with a welcome message
  useEffect(() => {
    if (!isInitialized.current && messages.length === 0) {
      isInitialized.current = true;
      setMessages([
        {
          role: 'assistant',
          content: `Hi there! I'm ${settings.agent_name || 'AI Assistant'}. How can I help you today?`
        }
      ]);
    }
  }, [messages.length, settings.agent_name]);
  
  const getAnswerFromOpenAIAssistant = async (clientId: string, query: string) => {
    try {
      console.log(`Getting answer from OpenAI assistant for client ${clientId}: "${query}"`);
      
      // Call the query-openai-assistant Edge Function
      const { data, error } = await supabase.functions.invoke('query-openai-assistant', {
        body: { client_id: clientId, query }
      });
      
      if (error) {
        console.error('Error querying OpenAI assistant:', error);
        return { 
          answer: "I'm sorry, I encountered an error while processing your question.", 
          error: `Error querying assistant: ${error.message}` 
        };
      }
      
      if (!data || !data.answer) {
        return { 
          answer: "I couldn't generate a proper response. Please try asking a different question.",
          error: data?.error || 'No answer returned from assistant'
        };
      }
      
      return {
        answer: data.answer,
        threadId: data.thread_id
      };
    } catch (error) {
      console.error('Error in getAnswerFromOpenAIAssistant:', error);
      return {
        answer: "I'm sorry, I encountered an error while processing your question.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
  
  const handleSendMessage = async () => {
    if (!query.trim() || isLoading) return;
    
    try {
      // Add user message to chat
      const userMessage = { role: 'user' as const, content: query };
      setMessages(prev => [...prev, userMessage]);
      setQuery('');
      setIsLoading(true);
      
      // Log the interaction if requested
      if (onTestInteraction) {
        await onTestInteraction();
      }
      
      console.log("Sending query to assistant:", query);
      
      // First try to get an answer from the OpenAI assistant
      let response;
      
      try {
        response = await getAnswerFromOpenAIAssistant(clientId, query);
        console.log("Response from OpenAI assistant:", response);
      } catch (error) {
        console.error("Error from OpenAI assistant:", error);
        response = { 
          error: true, 
          answer: null 
        };
      }
      
      // If the OpenAI assistant fails or doesn't have an answer, fall back to vector search
      if (response.error || !response.answer) {
        console.log('Falling back to vector search for answer generation');
        try {
          const vectorResponse = await generateAnswerFromDocuments(clientId, query);
          response = { answer: vectorResponse.answer };
          console.log("Response from vector search:", response);
        } catch (vectorError) {
          console.error("Error from vector search:", vectorError);
          response = { 
            answer: "I'm sorry, I couldn't find relevant information to answer your question."
          };
        }
      }
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer 
      }]);
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your question.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Define colors based on settings
  const themeColor = settings.chat_color || '#3b82f6';
  const textColor = settings.text_color || '#ffffff';
  const bgColor = settings.background_color || '#ffffff';
  
  return (
    <div className="w-full h-[600px] bg-gray-100 p-4 flex items-center justify-center rounded-lg border shadow-sm">
      <div className="relative w-full max-w-[350px] h-full flex flex-col">
        {/* Widget Button */}
        {!isOpen && (
          <div className="absolute bottom-0 right-0">
            <button
              onClick={() => setIsOpen(true)}
              style={{ backgroundColor: themeColor, color: textColor }}
              className="rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        )}

        {/* Chat Widget */}
        {isOpen && (
          <div
            className="h-full w-full flex flex-col rounded-lg shadow-lg overflow-hidden"
            style={{ backgroundColor: bgColor }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: themeColor, color: textColor }}
            >
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt={settings.agent_name || 'Assistant'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{settings.agent_name || 'AI Assistant'}</h3>
                {settings.agent_description && (
                  <p className="text-xs opacity-90">{settings.agent_description || 'How can I help you?'}</p>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'ml-auto bg-blue-500 text-white'
                      : 'mr-auto bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="mr-auto bg-gray-200 text-gray-800 max-w-[80%] p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!query.trim() || isLoading}
                  style={{ backgroundColor: themeColor, color: textColor }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-center mt-2 text-gray-500">
                Powered by AI
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
