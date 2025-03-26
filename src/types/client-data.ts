
import { Client } from "./client";

export interface ClientData {
  client: Client;
  isLoading: boolean;
  error: Error | null;
}
