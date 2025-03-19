
import { X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  return (
    <div 
      className="p-3 flex items-center justify-between border-b shadow-sm" 
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 border border-white border-opacity-20">
          {logoUrl ? (
            <AvatarImage 
              src={logoUrl} 
              alt={agentName}
              className="object-cover"
              onError={(e) => {
                console.error("Error loading logo in chat header:", logoUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <AvatarFallback className="text-xs bg-indigo-200 text-indigo-800">
            {agentName ? agentName.substring(0, 2).toUpperCase() : 'AI'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[180px]">{agentName || 'AI Assistant'}</span>
          <span className="text-xs opacity-75 truncate max-w-[180px]">Online</span>
        </div>
      </div>
      <button 
        onClick={onClose}
        className="text-inherit hover:opacity-75 transition-opacity p-1.5 rounded-full hover:bg-black hover:bg-opacity-10"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
