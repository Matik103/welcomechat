
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface LogoPreviewProps {
  logoUrl: string;
  onRemoveLogo: () => void;
}

export function LogoPreview({ logoUrl, onRemoveLogo }: LogoPreviewProps) {
  const [isError, setIsError] = useState(false);

  if (!logoUrl || isError) {
    return null;
  }

  return (
    <div className="relative group">
      <img 
        src={logoUrl} 
        alt="Logo" 
        className="h-16 w-16 object-contain rounded border border-gray-200"
        onError={(e) => {
          console.error("Error loading logo preview:", logoUrl);
          setIsError(true);
          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all rounded">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
          <Button 
            variant="secondary" 
            size="sm"
            className="text-transparent group-hover:text-white"
            onClick={onRemoveLogo}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
