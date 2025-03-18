
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Database, Bot } from "lucide-react";
import { AgentNameFixer } from "@/components/admin/AgentNameFixer";

export function AdminDashboardTools() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Management
          </CardTitle>
          <CardDescription>
            Create, edit, and manage client accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Link to="/admin/clients">
              <Button variant="outline" className="w-full">
                View All Clients
              </Button>
            </Link>
            <Link to="/admin/clients/new">
              <Button className="w-full">
                Create New Client
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Tools
          </CardTitle>
          <CardDescription>
            Execute and manage database operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Link to="/admin/database">
              <Button variant="outline" className="w-full">
                SQL Console
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Agent Tools
          </CardTitle>
          <CardDescription>
            Manage and update AI agent settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentNameFixer />
        </CardContent>
      </Card>
    </div>
  );
}
