
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Edit, MoreVertical, Settings, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditAgentDialog } from './EditAgentDialog';
import { DeleteAgentDialog } from './DeleteAgentDialog';
import type { Agent } from '@/services/agentService';

interface AgentCardProps {
  agent: Agent;
  onRefresh: () => void;
}

export function AgentCard({ agent, onRefresh }: AgentCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Format the last active date
  const lastActiveFormatted = agent.last_active 
    ? formatDistanceToNow(new Date(agent.last_active), { addSuffix: true })
    : 'Never used';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {agent.logo_url ? (
              <AvatarImage 
                src={agent.logo_url} 
                alt={agent.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <Badge 
              variant={agent.status === 'active' ? 'default' : 'secondary'}
              className="mt-1"
            >
              {agent.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="py-4">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {agent.agent_description || "No description provided."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Interactions</p>
            <p className="font-medium">{agent.total_interactions}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Response Time</p>
            <p className="font-medium">{agent.average_response_time.toFixed(2)}s</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Last Active</p>
            <p className="font-medium">{lastActiveFormatted}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </CardFooter>

      {/* Edit Agent Dialog */}
      <EditAgentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        agent={agent}
        onAgentUpdated={onRefresh}
      />

      {/* Delete Agent Dialog */}
      <DeleteAgentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        agentId={agent.id}
        agentName={agent.name}
        onAgentDeleted={onRefresh}
      />
    </Card>
  );
}
