
import { supabase } from "@/integrations/supabase/client";

export const setupRealtimeActivities = async () => {
  try {
    // Enable Realtime subscription for the client_activities table
    await supabase.channel('public:client_activities')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_activities',
      }, (payload) => {
        console.log('Client activity changed:', payload);
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status for client_activities: ${status}`);
      });

    // Enable Realtime subscription for the ai_agents table (all changes)
    await supabase.channel('public:ai_agents')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_agents',
      }, (payload) => {
        console.log('AI agent change detected:', payload);
      })
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

    return true;
  } catch (error) {
    console.error('Error setting up realtime activities:', error);
    return false;
  }
};
