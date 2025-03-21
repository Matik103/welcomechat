
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AgentNameWarningProps {
  show: boolean;
}

export const AgentNameWarning = ({ show }: AgentNameWarningProps) => {
  // Always return null to remove the notification completely
  return null;
};
