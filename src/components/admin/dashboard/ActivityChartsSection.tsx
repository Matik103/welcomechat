
import React from 'react';
import { ActivityChartCard } from '@/components/admin/ActivityChartCard';
import { Database, KeyRound, HardDrive, Zap } from 'lucide-react';

interface ActivityChartsSectionProps {
  activityCharts: {
    database: any;
    auth: any;
    storage: any;
    realtime: any;
  };
}

export function ActivityChartsSection({ activityCharts }: ActivityChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ActivityChartCard
        title="Database"
        subtitle="REST Requests"
        value={activityCharts.database.value}
        data={activityCharts.database.data}
        icon={<Database size={18} />}
      />
      
      <ActivityChartCard
        title="Auth"
        subtitle="Auth Requests"
        value={activityCharts.auth.value}
        data={activityCharts.auth.data}
        icon={<KeyRound size={18} />}
      />
      
      <ActivityChartCard
        title="Storage"
        subtitle="Storage Requests"
        value={activityCharts.storage.value}
        data={activityCharts.storage.data}
        icon={<HardDrive size={18} />}
      />
      
      <ActivityChartCard
        title="Realtime"
        subtitle="Realtime Requests"
        value={activityCharts.realtime.value}
        data={activityCharts.realtime.data}
        icon={<Zap size={18} />}
      />
    </div>
  );
}
