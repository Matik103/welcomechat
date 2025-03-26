
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  disabled?: boolean;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend,
  primaryColor,
  secondaryColor,
  textColor,
  disabled = false
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-3 flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2"
        style={{ 
          color: textColor,
          outlineColor: primaryColor || "#4F46E5" // Default to indigo if not provided
        }}
        disabled={disabled}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="p-2 rounded-full disabled:opacity-50 transition-colors"
        style={{ 
          backgroundColor: value.trim() && !disabled ? (primaryColor || "#4F46E5") : '#ccc',
          color: 'white'
        }}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
