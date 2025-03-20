
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AgentNameWarningProps {
  show: boolean;
}

export const AgentNameWarning = ({ show }: AgentNameWarningProps) => {
  if (!show) return null;
  
  return (
    <Alert variant="warning" className="bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Assistant Configuration Required</AlertTitle>
      <AlertDescription className="text-amber-700">
        Assistant is not fully configured. Please complete your Assistant setup in client settings before adding documents.
      </AlertDescription>
    </Alert>
  );
};
