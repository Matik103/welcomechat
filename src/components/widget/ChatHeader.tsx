
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface ChatHeaderProps {
  agentName: string;
  logoUrl?: string;
  backgroundColor: string;
  textColor: string;
  onClose: () => void;
}

export function ChatHeader({ 
  agentName, 
  logoUrl, 
  backgroundColor, 
  textColor, 
  onClose 
}: ChatHeaderProps) {
  // Display name logic - use provided name or "Chat" if empty
  const displayName = agentName || 'Chat';
  
  return (
    <div 
      className="p-3 flex items-center justify-between border-b" 
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={logoUrl} 
            alt={displayName}
            onError={(e) => {
              console.error("Error loading logo in chat header:", e);
              e.currentTarget.style.display = 'none';
            }}
          />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <span className="font-medium truncate max-w-[180px]">{displayName}</span>
      </div>
      <button 
        onClick={onClose}
        className="text-inherit hover:opacity-75 transition-opacity"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
