
export type DriveLink = {
  id: number;
  link: string;
  refresh_rate: number;
  client_id: string;
};

export type WebsiteUrl = {
  id: number;
  url: string;
  refresh_rate: number;
  client_id: string;
};

export type ClientFormData = {
  client_name: string;
  email: string;
  agent_name: string;
};
