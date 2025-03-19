
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
      <AlertTitle className="text-amber-800">Agent Name Required</AlertTitle>
      <AlertDescription className="text-amber-700">
        Agent name is not configured. Please set up an AI Agent Name in client settings before adding documents.
      </AlertDescription>
    </Alert>
  );
};
