
import React from "react";
import { LayoutDashboard } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
        <LayoutDashboard className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};
