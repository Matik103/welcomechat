
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  disabled?: boolean;
  fullscreen?: boolean;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend,
  primaryColor,
  secondaryColor,
  textColor,
  disabled = false,
  fullscreen = false
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className={`border-t border-gray-200 p-4 flex gap-2 items-center ${fullscreen ? 'bg-white' : ''}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 transition-all"
        style={{ 
          color: textColor,
          outlineColor: primaryColor
        }}
        disabled={disabled}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="p-2.5 rounded-full disabled:opacity-50 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ 
          backgroundColor: value.trim() && !disabled ? primaryColor : '#ccc',
          color: 'white',
          focusRingColor: primaryColor
        }}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
