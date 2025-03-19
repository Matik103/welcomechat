
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationResultProps {
  error: string | null;
  isValidated: boolean;
}

export const ValidationResult = ({
  error,
  isValidated,
}: ValidationResultProps) => {
  if (error) {
    return (
      <Alert 
        variant={error.includes("Note:") ? "warning" : "destructive"} 
        className={error.includes("Note:") ? "bg-amber-50 border-amber-200" : ""}
      >
        {error.includes("Note:") ? (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertDescription className={error.includes("Note:") ? "text-amber-700" : ""}>
          {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isValidated) {
    return (
      <Alert variant="success" className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Link Validated</AlertTitle>
        <AlertDescription className="text-green-700">
          This is a valid document link format.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};
