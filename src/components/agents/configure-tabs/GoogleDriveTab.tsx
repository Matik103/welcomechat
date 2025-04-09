
import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface GoogleDriveTabProps {
  clientId: string;
  agentName: string;
  onSuccess?: () => void;
}

export const GoogleDriveTab = ({ clientId, agentName, onSuccess }: GoogleDriveTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Google Drive Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect your Google Drive to train your AI assistant with documents.
        </p>
      </div>
      
      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          Google Drive integration allows your AI assistant to access and learn from your Google Docs and other documents.
        </AlertDescription>
      </Alert>
      
      <div className="text-center py-8 border border-dashed rounded-md">
        <p className="text-muted-foreground mb-4">Google Drive integration coming soon!</p>
        <Button variant="outline" disabled>
          Connect Google Drive
        </Button>
      </div>
    </div>
  );
};
