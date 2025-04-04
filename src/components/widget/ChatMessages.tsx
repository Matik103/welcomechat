
import React from 'react';

interface ChatMessage {
  text: string;
  isUser: boolean;
}

export interface ChatMessagesProps {
  messages: ChatMessage[];
  userBubbleColor?: string;
  assistantBubbleColor?: string;
  userTextColor?: string;
  assistantTextColor?: string;
  isLoading?: boolean; // Added isLoading prop
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  userBubbleColor = "#4F46E5",
  assistantBubbleColor = "#F3F4F6",
  userTextColor = "#FFFFFF",
  assistantTextColor = "#1F2937",
  isLoading = false, // Added default value for isLoading
}) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
          <div 
            className={`max-w-[80%] p-3 rounded-lg ${
              message.isUser 
                ? 'rounded-tr-none' 
                : 'rounded-tl-none'
            }`}
            style={{
              backgroundColor: message.isUser ? userBubbleColor : assistantBubbleColor,
              color: message.isUser ? userTextColor : assistantTextColor,
            }}
          >
            {message.text}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div 
            className="max-w-[80%] p-3 rounded-lg rounded-tl-none"
            style={{
              backgroundColor: assistantBubbleColor,
              color: assistantTextColor,
            }}
          >
            <div className="flex space-x-2 items-center">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
