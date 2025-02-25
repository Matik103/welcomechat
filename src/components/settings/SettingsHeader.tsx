
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const SettingsHeader = () => {
  return (
    <div className="flex items-center gap-4">
      <Link 
        to="/"
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and security preferences
        </p>
      </div>
    </div>
  );
};
