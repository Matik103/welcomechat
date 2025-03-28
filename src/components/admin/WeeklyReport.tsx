
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Calendar, Code, Layout, Paintbrush, Users } from 'lucide-react';

export const WeeklyReport = () => {
  const currentDate = new Date();
  
  // Calculate Monday and Friday of current week
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  
  const friday = new Date(currentDate);
  friday.setDate(currentDate.getDate() - currentDate.getDay() + 5);
  
  // Format dates as Month Day, Year
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  const dateRange = `${formatDate(monday)} - ${formatDate(friday)}`;
  
  const completedTasks = [
    {
      title: "Admin Dashboard Redesign",
      description: "Completely redesigned the admin dashboard with a new layout, improved navigation, and better data visualization components.",
      icon: <Layout className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Code Architecture Improvements",
      description: "Refactored codebase to meet the new design approach, improved component structure, and enhanced type safety.",
      icon: <Code className="h-5 w-5 text-green-500" />,
    },
    {
      title: "New Pages Creation",
      description: "Added several new pages to improve admin workflow and provide better resource management capabilities.",
      icon: <Paintbrush className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Authentication Pages Redesign",
      description: "Redesigned sign-in/sign-up pages with improved layout, added logo, and enhanced user experience.",
      icon: <Users className="h-5 w-5 text-orange-500" />,
    },
  ];

  return (
    <Card className="shadow-md border-t-4 border-t-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-800">Weekly Progress Report</CardTitle>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Calendar className="h-4 w-4" />
            {dateRange}
          </div>
        </div>
        <CardDescription>
          Summary of tasks completed this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {completedTasks.map((task, index) => (
            <li key={index} className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                {task.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {task.title}
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </h3>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
