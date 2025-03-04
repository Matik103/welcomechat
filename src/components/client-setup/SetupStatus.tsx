
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoadingStateProps {
  isLoading: boolean;
}

export const LoadingState = ({ isLoading }: LoadingStateProps) => {
  if (!isLoading) return null;
  
  return (
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-gray-600">Verifying your invitation...</p>
    </div>
  );
};

interface InvalidTokenProps {
  onNavigate: () => void;
}

export const InvalidToken = ({ onNavigate }: InvalidTokenProps) => {
  return (
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
      <p className="text-gray-600 mb-4">This invitation link is invalid or has expired.</p>
      <Button onClick={onNavigate}>Go to Login</Button>
    </div>
  );
};
