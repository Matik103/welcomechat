
import React from "react";
import { Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActionButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}

const ActionButton = ({ children, primary = false, onClick }: ActionButtonProps) => (
  <button
    onClick={onClick}
    className={`${
      primary
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
    } px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200`}
  >
    {children}
  </button>
);

export const ActionButtons = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-wrap gap-4">
      <ActionButton primary onClick={() => navigate('/admin/clients/add')}>
        <Plus className="w-4 h-4" /> Add New Client
      </ActionButton>
      <ActionButton onClick={() => navigate("/admin/clients")}>
        View Client List <ArrowRight className="w-4 h-4" />
      </ActionButton>
    </div>
  );
};
