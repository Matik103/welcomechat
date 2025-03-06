
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const EditInfoHeader = () => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link 
        to="/client/view"
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Edit Information</h1>
        <p className="text-gray-500">Update client information</p>
      </div>
    </div>
  );
};

export default EditInfoHeader;
