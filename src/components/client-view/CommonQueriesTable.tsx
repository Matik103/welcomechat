
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Query {
  id: number;
  query_text: string;
  frequency: number;
}

interface CommonQueriesTableProps {
  commonQueries: Query[] | undefined;
}

export const CommonQueriesTable: React.FC<CommonQueriesTableProps> = ({ commonQueries }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>End-User Questions</CardTitle>
        <CardDescription>Most frequently asked questions by end-users</CardDescription>
      </CardHeader>
      <CardContent>
        {commonQueries?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>End-User Question</TableHead>
                <TableHead className="text-right">Times Asked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commonQueries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell>{query.query_text}</TableCell>
                  <TableCell className="text-right">{query.frequency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-4">No end-user questions recorded yet</p>
        )}
      </CardContent>
    </Card>
  );
};
