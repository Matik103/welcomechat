
import React from "react";
import { Loader2 } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isLoading?: boolean;
}

export const MetricCard = ({ title, value, change, isLoading = false }: MetricCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-fade-in">
    <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
    {isLoading ? (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-gray-400">Loading...</span>
      </div>
    ) : (
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className={`text-sm font-medium mb-1 ${
            parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.startsWith('-') ? '' : '+'}{change}%
          </span>
        )}
      </div>
    )}
  </div>
);
