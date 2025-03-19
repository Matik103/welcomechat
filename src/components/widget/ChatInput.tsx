
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  settings: WidgetSettings;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function ChatInput({ input, isLoading, settings, onInputChange, onSendMessage }: ChatInputProps) {
  return (
    <div className="p-4 border-t">
      <form onSubmit={onSendMessage} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={isLoading || !input.trim()}
          style={{ backgroundColor: settings.secondary_color }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      <div className="text-xs text-gray-500 mt-2 text-center">
        {settings.response_time_text}
      </div>
    </div>
  );
}
