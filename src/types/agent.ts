
import { Json } from "@/integrations/supabase/types";

export interface Agent {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
  status: "active" | "inactive" | "deleted";
}

export interface ChatInteraction {
  id: string;
  client_id: string;      // Column name in database
  clientId?: string;      // Property name for consistency
  agent_name?: string;
  query: string;
  response: string;
  created_at: string;     // Column name in database
  timestamp?: string;     // Property name for consistency
  metadata?: any;
  responseTimeMs?: number;
}

export interface AgentSettings {
  widgetPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  initialMessages?: string[];
}

export interface AgentStats {
  totalInteractions: number;
  uniqueUsers: number;
  averageResponseTime: number;
  topQueries: {
    query: string;
    count: number;
  }[];
  lastActive?: string;
}
