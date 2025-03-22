
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface LogoPreviewProps {
  logoUrl: string;
  onRemoveLogo: () => void;
}

export function LogoPreview({ logoUrl, onRemoveLogo }: LogoPreviewProps) {
  const [isError, setIsError] = useState(false);
  
  // Reset error state when logoUrl changes
  useEffect(() => {
    setIsError(false);
  }, [logoUrl]);

  // If there's no logo URL or we've encountered an error, don't render anything
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
          console.error("Error loading logo preview from URL:", logoUrl);
          setIsError(true);
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
