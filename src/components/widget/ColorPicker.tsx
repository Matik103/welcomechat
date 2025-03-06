
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ColorPicker = ({ value, onChange, label }: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            style={{
              backgroundColor: localValue,
              color: getContrastColor(localValue),
              border: `1px solid ${getContrastColor(localValue, 0.2)}`
            }}
          >
            {label || "Select color"}
            <div 
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: localValue }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-4">
          <div className="space-y-2">
            <div>
              <input
                type="color"
                value={localValue}
                onChange={handleColorChange}
                className="w-full h-10"
              />
            </div>
            <Input
              value={localValue}
              onChange={handleInputChange}
              className="font-mono"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Helper function to determine if text should be light or dark based on background
function getContrastColor(hexColor: string, alpha = 1) {
  // Parse the hex color to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance - if it's bright, use dark text, if it's dark, use light text
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 
    `rgba(0, 0, 0, ${alpha})` : 
    `rgba(255, 255, 255, ${alpha})`;
}
