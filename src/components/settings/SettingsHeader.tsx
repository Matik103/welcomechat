
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const SettingsHeader = () => {
  return (
    <div className="flex items-center gap-4">
      <Link 
        to="/client/dashboard"
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your settings and preferences
        </p>
      </div>
    </div>
  );
};
