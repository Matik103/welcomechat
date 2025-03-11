
import { Database as DatabaseGenerated } from "@/integrations/supabase/types";

export type Tables<T extends keyof DatabaseGenerated['public']['Tables']> = DatabaseGenerated['public']['Tables'][T]['Row'];
export type Enums<T extends keyof DatabaseGenerated['public']['Enums']> = DatabaseGenerated['public']['Enums'][T];
export type TablesInsert<T extends keyof DatabaseGenerated['public']['Tables']> = DatabaseGenerated['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DatabaseGenerated['public']['Tables']> = DatabaseGenerated['public']['Tables'][T]['Update'];

// Specific table types
export type UserRole = Tables<'user_roles'>;
export type Client = Tables<'clients'>;
export type ClientActivity = Tables<'client_activities'>;
export type GoogleDriveLink = Tables<'google_drive_links'>;
export type WebsiteUrl = Tables<'website_urls'>;
export type ErrorLog = Tables<'error_logs'>;
export type CommonQuery = Tables<'common_queries'>;
