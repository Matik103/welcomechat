
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const ClientHeader = () => {
  return (
    <div className="flex items-center gap-4">
      <Link 
        to="/"
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
        <p className="text-gray-500">View and manage your clients</p>
      </div>
    </div>
  );
};
