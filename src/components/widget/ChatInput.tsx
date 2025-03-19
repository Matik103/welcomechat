
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend,
  primaryColor,
  secondaryColor,
  textColor
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
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
          focusRing: primaryColor
        }}
      />
      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="p-2 rounded-full disabled:opacity-50"
        style={{ 
          backgroundColor: value.trim() ? primaryColor : '#ccc',
          color: 'white'
        }}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
