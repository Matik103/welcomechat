
export interface ChatInteraction {
  id: number;
  content: string;
  metadata: {
    timestamp: string;
    user_message: string;
    type: string;
  };
}
