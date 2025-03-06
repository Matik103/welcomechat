
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const ClientIdMissingAlert = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Client ID Missing</h2>
            <p className="text-gray-700 mb-4">
              We couldn't find your client ID. This is required to edit information.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Link to="/client/view">
                <Button>Return to Dashboard</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientIdMissingAlert;
