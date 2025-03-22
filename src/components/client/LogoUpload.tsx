
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  onLogoChange: (file: File | null) => void;
  initialLogoUrl?: string;
}

export function LogoUpload({ onLogoChange, initialLogoUrl }: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setLogoUrl(fileUrl);
      onLogoChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileUrl = URL.createObjectURL(file);
      setLogoUrl(fileUrl);
      onLogoChange(file);
    }
  };

  const handleClearLogo = () => {
    setLogoUrl(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <div 
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          logoUrl ? "aspect-auto" : "min-h-[200px]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {logoUrl ? (
          <div className="flex flex-col items-center space-y-4 w-full">
            <img 
              src={logoUrl} 
              alt="Logo preview" 
              className="max-h-[150px] object-contain rounded" 
            />
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearLogo}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                <line x1="16" y1="5" x2="22" y2="5"></line>
                <line x1="19" y1="2" x2="19" y2="8"></line>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-700">Drag and drop an image here or</p>
              <Button 
                type="button" 
                variant="link" 
                className="mt-1 h-auto p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                click to upload
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: PNG, JPG, GIF (max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
