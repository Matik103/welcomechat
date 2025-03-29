
import ErrorDisplay from "@/components/ErrorDisplay";
import { Toaster } from "sonner";

type ConfigErrorProps = {
  message: string;
  details: string;
};

export const ConfigError = ({ message, details }: ConfigErrorProps) => {
  return (
    <div className="min-h-screen bg-background p-4">
      <ErrorDisplay 
        title="Configuration Error" 
        message={message} 
        details={details}
      />
      <Toaster />
    </div>
  );
};
