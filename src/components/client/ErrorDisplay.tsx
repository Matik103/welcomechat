
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-semibold">Error loading client data</p>
            <p className="text-red-600 mt-1">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
