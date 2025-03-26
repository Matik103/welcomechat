
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

// Short type alias for client activity payload
type ClientActivityPayload = PostgresChangesPayload<Database['public']['Tables']['client_activities']['Row']>;
type AIAgentsPayload = PostgresChangesPayload<Database['public']['Tables']['ai_agents']['Row']>;

export const setupRealtimeActivities = async () => {
  try {
    // Enable Realtime subscription for the client_activities table
    const clientActivitiesChannel = supabase.channel('public:client_activities');
    
    clientActivitiesChannel
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'client_activities' 
        }, 
        (payload: ClientActivityPayload) => {
          console.log('Client activity changed:', payload);
          // Optional: Show toast notification for important activities
          if (payload.new && shouldNotifyActivity(payload.new.activity_type)) {
            toast.info(
              "New Activity", 
              { 
                description: payload.new.description || `${payload.new.activity_type} occurred` 
              }
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for client_activities: ${status}`);
      });

    // Enable Realtime subscription for the ai_agents table (all changes)
    const aiAgentsChannel = supabase.channel('public:ai_agents');
    
    aiAgentsChannel
      .on(
        'postgres_changes', 
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_links',
      }, (payload) => {
        console.log('Document link changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for website URLs
    await supabase.channel('public:website_urls')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'website_urls',
      }, (payload) => {
        console.log('Website URL changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for clients table
    await supabase.channel('public:clients')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients',
      }, (payload) => {
        console.log('Client changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for document processing
    await supabase.channel('public:document_processing')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_processing',
      }, (payload) => {
        console.log('Document processing changed:', payload);
      })
      .subscribe();

    // Enable Realtime subscription for user roles
    await supabase.channel('public:user_roles')
      .on('postgres_changes', {
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

// Helper function to determine if we should notify about an activity
const shouldNotifyActivity = (activityType: string): boolean => {
  // Only notify about important events to avoid overwhelming users
  const notifiableActivities = [
    'client_created',
    'client_deleted',
    'agent_error',
    'document_processing_failed',
    'error_logged',
    'system_update'
  ];
  
  return notifiableActivities.includes(activityType);
};
