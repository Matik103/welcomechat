
export interface DriveLink {
  id: number;
  client_id: string;
  link: string;
  refresh_rate: number;
  created_at: string;
  updated_at: string;
  file_id?: string;
  access_status?: 'accessible' | 'restricted' | 'unknown';
}
