
export interface ChatInteraction {
  id: string | number;
  content: string;
  metadata: {
    timestamp: string;
    user_message: string;
    type?: string;
    [key: string]: any; // Allow for additional metadata fields
  };
}
