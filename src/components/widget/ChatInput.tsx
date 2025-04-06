
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  placeholder?: string;
  buttonText?: string;
  isLoading?: boolean;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  buttonText = "Send",
  isLoading = false,
  buttonBgColor = "#4F46E5",
  buttonTextColor = "#FFFFFF"
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); onSubmit(e); }} 
      className="border-t p-3 flex space-x-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={isLoading || !value.trim()}
        style={{
          backgroundColor: buttonBgColor,
          color: buttonTextColor,
          minWidth: '80px', // Increased minimum width 
          padding: '0 16px', // Added more horizontal padding
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          overflow: 'visible',
          position: 'relative',
          zIndex: 10 // Ensure button is above other elements
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
};
