
import React from 'react';
import { ActivityChartCard } from '@/components/admin/ActivityChartCard';
import { Database, KeyRound, HardDrive, Zap } from 'lucide-react';

interface ActivityChartsSectionProps {
  activityCharts: {
    database: {
      value?: number;
      data?: number[];
    };
    auth: {
      value?: number;
      data?: number[];
    };
    storage: {
      value?: number;
      data?: number[];
    };
    realtime: {
      value?: number;
      data?: number[];
    };
  };
}

export function ActivityChartsSection({ activityCharts }: ActivityChartsSectionProps) {
  // Ensure we have data to display, fallback to empty arrays if needed
  const safeData = {
    database: {
      value: activityCharts?.database?.value || 0,
      data: activityCharts?.database?.data || []
    },
    auth: {
      value: activityCharts?.auth?.value || 0,
      data: activityCharts?.auth?.data || []
    },
    storage: {
      value: activityCharts?.storage?.value || 0,
      data: activityCharts?.storage?.data || []
    },
    realtime: {
      value: activityCharts?.realtime?.value || 0,
      data: activityCharts?.realtime?.data || []
    }
  };

  // Transform number arrays to format required by ActivityChartCard
  const transformData = (data: number[]): { name: string; value: number }[] => {
    return data.map((value, index) => ({
      name: `Point ${index + 1}`,
      value
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ActivityChartCard
        title="Database"
        subtitle="REST Requests"
        value={safeData.database.value}
        data={transformData(safeData.database.data)}
        icon={<Database size={18} />}
      />
      
      <ActivityChartCard
        title="Auth"
        subtitle="Auth Requests"
        value={safeData.auth.value}
        data={transformData(safeData.auth.data)}
        icon={<KeyRound size={18} />}
      />
      
      <ActivityChartCard
        title="Storage"
        subtitle="Storage Requests"
        value={safeData.storage.value}
        data={transformData(safeData.storage.data)}
        icon={<HardDrive size={18} />}
      />
      
      <ActivityChartCard
        title="Realtime"
        subtitle="Realtime Requests"
        value={safeData.realtime.value}
        data={transformData(safeData.realtime.data)}
        icon={<Zap size={18} />}
      />
    </div>
  );
}
