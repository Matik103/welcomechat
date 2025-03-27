
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

// Define payload type for better type safety
type PostgresChangesPayload<T> = {
  new: T;
  old: T | null;
  errors: any;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

// Short type alias for AI agents payload
type AIAgentsPayload = PostgresChangesPayload<Database['public']['Tables']['ai_agents']['Row']>;

export const setupRealtimeActivities = async () => {
  try {
    // Note: client_activities table has been removed, so we don't subscribe to it
    console.log('Activity logging is disabled - client_activities table has been removed');
    
    // Enable Realtime subscription for the ai_agents table (all changes)
    const aiAgentsChannel = supabase.channel('public:ai_agents');
    
    aiAgentsChannel
      .on('postgres_changes' as any, 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ai_agents' 
        }, 
        (payload: AIAgentsPayload) => {
          console.log('AI agent change detected:', payload);
          
          // Log specific AI agent events based on the interaction_type
          if (payload.new && payload.new.interaction_type === 'chat_interaction') {
            // We could handle specific chat interaction changes here
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ai_agents: ${status}`);
      });

    // Enable Realtime subscription for document-related tables
    await supabase.channel('public:document_links')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'document_links',
      }, (payload) => {
        console.log('Document link changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for website URLs
    await supabase.channel('public:website_urls')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'website_urls',
      }, (payload) => {
        console.log('Website URL changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for clients table
    await supabase.channel('public:clients')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'clients',
      }, (payload) => {
        console.log('Client changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for document processing
    await supabase.channel('public:document_processing')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'document_processing',
      }, (payload) => {
        console.log('Document processing changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for user roles
    await supabase.channel('public:user_roles')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'user_roles',
      }, (payload) => {
        console.log('User role changed:', payload);
      })
      .subscribe();

    return true;
  } catch (error) {
    console.error('Error setting up realtime activities:', error);
    return false;
  }
};
