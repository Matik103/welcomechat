
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatHeader } from "@/components/widget/ChatHeader";
import { ChatMessages } from "@/components/widget/ChatMessages";
import { ChatInput } from "@/components/widget/ChatInput";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewCardProps {
  settings: WidgetSettings;
  clientId?: string;
}

export function WidgetPreviewCard({ settings, clientId }: WidgetPreviewCardProps) {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: settings.welcome_text || "Hi 👋, how can I help?", isUser: false },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Update welcome message when settings change
  useEffect(() => {
    if (settings.welcome_text) {
      setMessages([{ text: settings.welcome_text, isUser: false }]);
    }
  }, [settings.welcome_text]);

  const handleSend = () => {
    if (inputValue.trim()) {
      // Add user message
      setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
      setInputValue("");
      
      // Simulate AI response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev, 
          { 
            text: "This is a preview of how your AI assistant will look. In the actual widget, this is where your AI will respond to customer questions.", 
            isUser: false 
          }
        ]);
      }, 1500);
    }
  };

  const handleClose = () => {
    // Reset the chat for preview purposes
    setMessages([{ text: settings.welcome_text || "Hi 👋, how can I help?", isUser: false }]);
  };

  return (
    <Card className="h-[550px] flex flex-col">
      <CardHeader className="px-0 pt-0 pb-0">
        <CardTitle className="text-lg font-medium p-4">Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full border rounded-b-lg overflow-hidden">
          <ChatHeader
            agentName={settings.agent_name || "AI Assistant"}
            logoUrl={settings.logo_url}
            backgroundColor={settings.chat_color || "#854fff"}
            textColor="#ffffff"
            onClose={handleClose}
          />
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages
              messages={messages}
              backgroundColor={settings.background_color || "#ffffff"}
              textColor={settings.text_color || "#333333"}
              secondaryColor={settings.secondary_color || "#6b3fd4"}
              isTyping={isTyping}
              messagesEndRef={messagesEndRef}
              logoUrl={settings.logo_url}
              agentName={settings.agent_name || "AI Assistant"}
            />
            <ChatInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSend={handleSend}
              primaryColor={settings.chat_color || "#854fff"}
              secondaryColor={settings.secondary_color || "#6b3fd4"}
              textColor={settings.text_color || "#333333"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
