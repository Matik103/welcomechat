
import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
}

export const MetricCard = ({ title, value, change }: MetricCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-fade-in">
    <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      {change && (
        <span className="text-green-600 text-sm font-medium mb-1">
          {change.startsWith('-') ? '' : '+'}{change}%
        </span>
      )}
    </div>
  </div>
);
