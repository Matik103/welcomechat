
import { X } from "lucide-react";

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
  // Display name logic - use provided name or "Assistant" if empty
  const displayName = agentName || 'Assistant';
  
  return (
    <div 
      className="p-3 flex items-center justify-between border-b" 
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex items-center gap-2">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={displayName}
            className="w-6 h-6 object-contain rounded"
            onError={(e) => {
              console.error("Error loading logo in chat header:", logoUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
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
