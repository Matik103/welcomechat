
import { useState, useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: Array<{ text: string; isUser: boolean }>;
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
}

export function ChatMessages({ 
  messages, 
  backgroundColor, 
  textColor, 
  secondaryColor 
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div 
      className="flex-1 overflow-y-auto p-3 space-y-3"
      style={{ backgroundColor, color: textColor }}
    >
      {messages.map((message, index) => (
        <div 
          key={index}
          className={`p-3 rounded-lg max-w-[85%] ${
            message.isUser 
              ? 'ml-auto' 
              : 'mr-auto'
          }`}
          style={
            message.isUser 
              ? { backgroundColor: secondaryColor, color: 'white' }
              : { backgroundColor: 'rgba(243, 244, 246, 0.8)', color: textColor }
          }
        >
          {message.text}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
