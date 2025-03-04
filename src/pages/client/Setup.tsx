
import { useLocation } from "react-router-dom";
import { useSetupToken } from "@/hooks/useSetupToken";
import { PasswordForm } from "@/components/client-setup/PasswordForm";
import { LoadingState, InvalidToken } from "@/components/client-setup/SetupStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ClientSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL
  const query = new URLSearchParams(location.search);
  const token = query.get("token");

  // Use our custom hook for token verification
  const { isLoading, tokenData } = useSetupToken(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingState isLoading={isLoading} />
      </div>
    );
  }

  if (!tokenData?.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <InvalidToken onNavigate={() => navigate("/auth")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Setup</CardTitle>
          <CardDescription>
            Create your password to access the {tokenData.clientName} AI Assistant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm tokenData={tokenData} token={token || ""} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetup;
