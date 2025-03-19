
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationResultProps {
  error: string | null;
  isValidated: boolean;
  lastResult: any | null;
}

export const ValidationResult = ({
  error,
  isValidated,
  lastResult,
}: ValidationResultProps) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (isValidated && !error && lastResult) {
    return (
      <Alert variant="success" className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">URL Validated</AlertTitle>
        <AlertDescription className="text-green-700">
          This website is accessible and can be added to your sources.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};
