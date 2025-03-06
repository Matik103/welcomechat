
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-700">Error loading client data: {message}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
