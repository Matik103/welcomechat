
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";

interface WidgetPreviewProps {
  settings: WidgetSettings;
  showPreview: boolean;
  onTogglePreview: (isVisible: boolean) => void;
}

export function WidgetPreview({ settings, showPreview, onTogglePreview }: WidgetPreviewProps) {
  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => onTogglePreview(!showPreview)}
      >
        {showPreview ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Preview
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Show Preview
          </>
        )}
      </Button>
      
      {showPreview && (
        <div className="relative border border-gray-200 rounded-md p-4 h-96 bg-gray-50">
          <div 
            className="absolute bottom-4 right-4 w-14 h-14 rounded-full shadow-md flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: settings.chat_color }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
