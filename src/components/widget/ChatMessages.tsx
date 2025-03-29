
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { Bot, User } from "lucide-react";

interface ChatMessagesProps {
  messages: { text: string; isUser: boolean }[];
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  logoUrl?: string;
}

export function ChatMessages({ 
  messages, 
  backgroundColor, 
  textColor, 
  secondaryColor, 
  isTyping,
  messagesEndRef,
  logoUrl
}: ChatMessagesProps) {
  return (
    <div 
      className="flex-1 overflow-y-auto p-3"
      style={{ backgroundColor }}
    >
      {messages.map((message, i) => (
        <div 
          key={i} 
          className={`flex items-start mb-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
        >
          {!message.isUser && (
            <Avatar className="mr-2 h-8 w-8 flex-shrink-0">
              {logoUrl ? (
                <AvatarImage 
                  src={logoUrl} 
                  alt="Assistant" 
                  onError={(e) => {
                    console.error("Error loading logo in message:", e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
          
          <div 
            className={`px-3 py-2 rounded-lg max-w-[80%]`}
            style={{ 
              backgroundColor: message.isUser ? secondaryColor : '#f3f4f6',
              color: message.isUser ? 'white' : textColor
            }}
          >
            {message.text}
          </div>
          
          {message.isUser && (
            <Avatar className="ml-2 h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      
      {isTyping && (
        <div className="flex items-start mb-3">
          <Avatar className="mr-2 h-8 w-8 flex-shrink-0">
            {logoUrl ? (
              <AvatarImage 
                src={logoUrl} 
                alt="Assistant" 
                onError={(e) => {
                  console.error("Error loading logo in typing indicator:", e);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div 
            className="px-3 py-2 rounded-lg bg-gray-100"
            style={{ color: textColor }}
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
  );
}
