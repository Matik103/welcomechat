
import React from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActionButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  blue?: boolean;
}

const ActionButton = ({ children, primary = false, blue = false, onClick }: ActionButtonProps) => (
  <button
    onClick={onClick}
    className={`${
      primary
        ? "bg-primary text-white hover:bg-primary/90"
        : blue
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
    } px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200`}
  >
    {children}
  </button>
);

export const NewActionButtons = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-wrap gap-4">
      <ActionButton onClick={() => navigate("/admin/clients")}>
        View Client List <ArrowRight className="w-4 h-4" />
      </ActionButton>
      <ActionButton blue onClick={() => navigate("/admin/clients/add")}>
        <Plus className="w-4 h-4" /> Add Client
      </ActionButton>
    </div>
  );
};
