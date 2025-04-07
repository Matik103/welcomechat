
import React, { useState } from 'react';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Database, Upload } from 'lucide-react';

interface DriveLinksProps {
  clientId: string;
}

export function DriveLinks({ clientId }: DriveLinksProps) {
  const { uploadDocument, isUploading } = useUnifiedDocumentUpload(clientId);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    try {
      // Placeholder for future drive integration
      toast.info("Google Drive integration coming soon!");
      
      // Simulating connection process
      setTimeout(() => {
        setIsConnecting(false);
      }, 1500);
    } catch (error: any) {
      toast.error(`Failed to connect to Google Drive: ${error.message}`);
      setIsConnecting(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Connect to Google Drive</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your Google Drive to automatically import documents.
      </p>
      
      <Button 
        onClick={handleConnectDrive} 
        className="w-full"
        disabled={isConnecting}
      >
        {isConnecting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          <span className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Connect to Google Drive
          </span>
        )}
      </Button>
    </Card>
  );
}
