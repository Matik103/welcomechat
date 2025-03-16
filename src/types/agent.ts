
export interface ChatInteraction {
  id: string | number;
  query: string;
  response: string;
  timestamp: string;
  clientId: string;
  responseTimeMs: number;
  metadata?: {
    timestamp?: string;
    user_message?: string;
    type?: string;
    [key: string]: any;
  };
  content?: string;
}
