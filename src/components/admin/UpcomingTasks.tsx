
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export const UpcomingTasks = () => {
  // Calculate dates for next week
  const currentDate = new Date();
  const nextMonday = new Date(currentDate);
  nextMonday.setDate(currentDate.getDate() - currentDate.getDay() + 8);
  
  const nextFriday = new Date(currentDate);
  nextFriday.setDate(currentDate.getDate() - currentDate.getDay() + 12);
  
  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  const dateRange = `${formatDate(nextMonday)} - ${formatDate(nextFriday)}`;
  
  const upcomingTasks = [
    {
      title: "Client Dashboard Improvements",
      description: "Implement new layout and approach for the client dashboard with enhanced visualization components.",
      priority: "High",
    },
    {
      title: "Account Settings Redesign",
      description: "Update account settings with new layout and improved user preference management.",
      priority: "Medium",
    },
    {
      title: "Document Text Extraction",
      description: "Finish text extraction from documents using LlamaParse for better document processing.",
      priority: "High",
    },
    {
      title: "Website Scraping Implementation",
      description: "Complete website scraping functionality with FireCrawl for content management.",
      priority: "Medium",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="shadow-md border-t-4 border-t-purple-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-800">Upcoming Tasks</CardTitle>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Calendar className="h-4 w-4" />
            {dateRange}
          </div>
        </div>
        <CardDescription>
          Tasks planned for next week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {upcomingTasks.map((task, index) => (
            <li key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              <div className="flex items-center text-xs text-gray-500 mt-2">
                <Clock className="h-3 w-3 mr-1" />
                Planned for next week
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
