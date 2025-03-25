
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { useActivities } from '@/hooks/useActivities';
import { useInteractions } from '@/hooks/useInteractions';
import { useClients } from '@/hooks/useClients';
import { useClientStats } from '@/hooks/useClientStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent 
} from "@/components/ui/chart";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ActivityLogEntry } from '@/types/activity';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const getMonthlyChange = (current: number, previous: number): number => {
  if (previous === 0) return 100; // 100% increase from 0 to 1
  const changePercentage = ((current - previous) / previous) * 100;
  return parseFloat(changePercentage.toFixed(2));
};

export default function Index() {
  const { activities, isLoading: isLoadingActivities, error: activitiesError, refresh } = useActivities();
  const { totalInteractions, dailyInteractions, topClients, isLoading: isLoadingInteractions, error: interactionsError } = useInteractions();
  const { isLoading: isLoadingClients, error: clientsError } = useClients();
  const { totalClients, activeClients, data } = useClientStats();

  const [metrics, setMetrics] = useState([
    { title: 'Total Interactions', currentValue: totalInteractions, previousValue: 0 },
    { title: 'Total Clients', currentValue: totalClients, previousValue: 0 },
    { title: 'Active Clients', currentValue: activeClients, previousValue: 0 },
  ]);

  useEffect(() => {
    setMetrics([
      { title: 'Total Interactions', currentValue: totalInteractions, previousValue: 0 },
      { title: 'Total Clients', currentValue: totalClients, previousValue: 0 },
      { title: 'Active Clients', currentValue: activeClients, previousValue: 0 },
    ]);
  }, [totalInteractions, totalClients, activeClients]);

  const chartData = {
    labels: dailyInteractions.map(item => item.date),
    datasets: [
      {
        label: 'Daily Interactions',
        data: dailyInteractions.map(item => item.count),
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgb(79, 70, 229)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: 'Daily Interactions',
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric) => {
            const monthlyChange = getMonthlyChange(+metric.currentValue, +metric.previousValue);
            return (
              <Card key={metric.title} className="shadow-sm">
                <CardHeader>
                  <CardTitle>{metric.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.currentValue}</div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    Monthly Change:
                    <span className="ml-1 font-medium text-green-500">{monthlyChange}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <p>Loading activity...</p>
              ) : activitiesError ? (
                <p>Error: {activitiesError.message}</p>
              ) : (
                <>
                  {activities && activities.length > 0 ? (
                    <ScrollArea className="h-[300px] w-full">
                      <ActivityList activities={activities as ActivityLogEntry[]} />
                    </ScrollArea>
                  ) : (
                    <p>No recent activity.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Daily Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInteractions ? (
                <p>Loading interactions...</p>
              ) : interactionsError ? (
                <p>Error: {interactionsError.message}</p>
              ) : (
                <ChartContainer
                  config={{
                    interactions: {
                      color: '#4F46E5',
                    },
                  }}
                >
                  <Line data={chartData} options={chartOptions} />
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
