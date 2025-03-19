
import { RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessagesProps {
  messages: { text: string; isUser: boolean }[];
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  isTyping?: boolean;
  messagesEndRef?: RefObject<HTMLDivElement>;
  logoUrl?: string;
  agentName: string;
}

export function ChatMessages({ 
  messages, 
  backgroundColor, 
  textColor, 
  secondaryColor,
  isTyping = false,
  messagesEndRef,
  logoUrl,
  agentName
}: ChatMessagesProps) {
  // Helper function to generate initials from agent name
  const getInitials = (name: string) => {
    if (!name) return "AI";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div 
      className="flex-1 p-4 overflow-y-auto"
      style={{ backgroundColor }}
    >
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            {!message.isUser && (
              <Avatar className="w-8 h-8 border border-gray-200 shadow-sm overflow-hidden">
                {logoUrl ? (
                  <AvatarImage 
                    src={logoUrl} 
                    alt={agentName} 
                    className="object-cover w-full h-full"
                  />
                ) : null}
                <AvatarFallback className="text-xs bg-indigo-100 text-indigo-800 font-medium">
                  {getInitials(agentName)}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div 
              className={`max-w-[75%] rounded-xl p-3 ${
                message.isUser 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 rounded-tl-none'
              }`}
              style={{
                backgroundColor: message.isUser ? secondaryColor : 'rgb(243, 244, 246)',
                color: message.isUser ? 'white' : textColor,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
            
            {message.isUser && (
              <Avatar className="w-8 h-8 bg-gray-400 text-white">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <Avatar className="w-8 h-8 border border-gray-200 overflow-hidden">
              {logoUrl ? (
                <AvatarImage 
                  src={logoUrl} 
                  alt={agentName} 
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-800 font-medium">
                {getInitials(agentName)}
              </AvatarFallback>
            </Avatar>
            
            <div 
              className="max-w-[75%] rounded-xl p-3 bg-gray-100 rounded-tl-none"
              style={{ color: textColor }}
            >
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible div for scrolling to bottom */}
        <div ref={messagesEndRef}></div>
      </div>
    </div>
  );
}
