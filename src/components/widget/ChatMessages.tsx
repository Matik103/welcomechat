
import { Loader2 } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  settings: WidgetSettings;
}

export function ChatMessages({ messages, isLoading, settings }: ChatMessagesProps) {
  return (
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
  );
}
