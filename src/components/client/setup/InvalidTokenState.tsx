
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const InvalidTokenState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
        <p className="text-gray-600 mb-4">This invitation link is invalid or has expired.</p>
        <Button onClick={() => navigate("/auth")}>Go to Login</Button>
      </div>
    </div>
  );
};
