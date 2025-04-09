
// Shared types for edge functions

export interface DocumentContent {
  id: number;
  client_id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at?: string;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekRequest {
  client_id: string;
  query: string;
  messages?: Message[];
  system_prompt?: string;
  use_history?: boolean;
  temperature?: number;
}

export interface DeepSeekAssistantRequest {
  client_id: string;
  agent_name: string;
  agent_description?: string;
  client_name?: string;
}

export interface DeepSeekResponse {
  answer: string;
  messages: Message[];
}
