
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetPreviewProps {
  settings: WidgetSettings;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export function WidgetPreview({ settings, showPreview, onTogglePreview }: WidgetPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // If webhook URL is provided, use n8n
      if (settings.webhook_url) {
        const response = await fetch(settings.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            sessionId: Date.now().toString(), // Unique session ID
          }),
        });

        if (!response.ok) {
          throw new Error('Webhook request failed');
        }

        const data = await response.json();
        
        // Save interaction to n8n_chat_histories
        await fetch("https://mgjodiqecnnltsgorife.supabase.co/rest/v1/n8n_chat_histories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODgwNzAsImV4cCI6MjA1NDI2NDA3MH0.UAu24UdDN_5iAWPkQBgBgEuq3BZDKjwDiK2_AT84_is"
          },
          body: JSON.stringify({
            session_id: Date.now().toString(),
            message: {
              user_message: userMessage,
              bot_response: data.response
            }
          }),
        });

        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        // Fallback to default chat function
        const response = await fetch("https://mgjodiqecnnltsgorife.supabase.co/functions/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: userMessage,
            agent_name: settings.agent_name,
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setMessages(prev => [...prev, { role: 'assistant', content: data.generatedText }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Sorry, I encountered an error. Please try again.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showPreview) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          <Monitor className="w-4 h-4 mr-2" />
          Show Preview
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={onTogglePreview}>
          <Monitor className="w-4 h-4 mr-2" />
          Hide Preview
        </Button>
      </div>
      <div className="border rounded-lg h-[500px] relative">
        <div className="absolute bottom-4 right-4 w-96 h-[450px] border rounded-lg shadow-lg bg-white flex flex-col">
          <ChatHeader settings={settings} />
          <ChatMessages 
            messages={messages}
            isLoading={isLoading}
            settings={settings}
          />
          <ChatInput
            input={input}
            isLoading={isLoading}
            settings={settings}
            onInputChange={setInput}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}
