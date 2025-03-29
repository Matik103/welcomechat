
import { RefObject } from 'react';
import { Loader2 } from 'lucide-react';

interface ChatMessagesProps {
  messages: { text: string; isUser: boolean }[];
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  isTyping?: boolean;
  messagesEndRef?: RefObject<HTMLDivElement>;
}

export function ChatMessages({ 
  messages, 
  backgroundColor, 
  textColor, 
  secondaryColor,
  isTyping = false,
  messagesEndRef
}: ChatMessagesProps) {
  return (
    <div 
      className="flex-1 p-3 overflow-y-auto"
      style={{ backgroundColor }}
    >
      <div className="space-y-3">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isUser 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100'
              }`}
              style={{
                backgroundColor: message.isUser ? secondaryColor : 'rgb(243, 244, 246)',
                color: message.isUser ? 'white' : textColor
              }}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div 
              className="max-w-[80%] rounded-lg p-3 bg-gray-100"
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
