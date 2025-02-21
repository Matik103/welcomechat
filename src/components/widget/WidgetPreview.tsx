
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Monitor, Send, Loader2 } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { useToast } from "@/components/ui/use-toast";

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

  const handleSendMessage = async () => {
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
          <div
            className="h-12 flex items-center px-4 rounded-t-lg"
            style={{ backgroundColor: settings.chat_color }}
          >
            <div className="flex items-center gap-3">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt="Agent logo"
                  className="w-8 h-8 rounded object-contain bg-white"
                />
              )}
              <span className="font-medium text-white">
                {settings.agent_name || "AI Agent"}
              </span>
            </div>
          </div>
          <div
            className="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
            style={{
              backgroundColor: settings.background_color,
              color: settings.text_color,
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-sm opacity-50 my-8">
                {settings.welcome_text}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-gray-100 ml-auto'
                      : 'bg-primary text-white mr-auto'
                  }`}
                  style={{
                    backgroundColor: message.role === 'user' 
                      ? '#f3f4f6' 
                      : settings.chat_color
                  }}
                >
                  {message.content}
                </div>
              ))
            )}
            {isLoading && (
              <div 
                className="rounded-lg p-3 max-w-[80%] mr-auto flex items-center gap-2"
                style={{ backgroundColor: settings.chat_color }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-white">Typing...</span>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isLoading || !input.trim()}
                style={{ backgroundColor: settings.secondary_color }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {settings.response_time_text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
