
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { QueryItem } from "@/types/client-dashboard";
import { format } from "date-fns";

interface QueriesCardProps {
  queries: QueryItem[] | undefined;
  isLoading?: boolean;
}

export const QueriesCard = ({ queries, isLoading = false }: QueriesCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Common User Queries
          </CardTitle>
          <CardDescription>Questions frequently asked by users</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !queries || queries.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No common queries recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">User interactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map((query, index) => (
              <div 
                key={query.id || index} 
                className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-md shadow-sm"
              >
                <div className="flex justify-between">
                  <div className="pr-4">
                    <p className="font-medium text-gray-900 text-sm">{query.query_text}</p>
                  </div>
                  <div className="flex flex-col items-end whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {query.frequency}×
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {query.last_asked ? format(new Date(query.last_asked), 'MMM d') : 'Unknown date'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
