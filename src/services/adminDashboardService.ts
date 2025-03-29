
import { supabase } from '@/integrations/supabase/client';
import { generateChartData } from '@/utils/chartDataUtils';

/**
 * Fetches client-related metrics for the admin dashboard
 * @returns Client metrics including total, active and change percentage
 */
export const fetchClientMetrics = async () => {
  try {
    console.log('Fetching client metrics...');
    // Time threshold for "active" clients (48 hours ago)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    
    // Clients: Get all unique client_ids from ai_agents table (exclude deleted)
    const { data: agentsData, error: agentsError } = await supabase
      .from('ai_agents')
      .select('client_id, last_active, status, deleted_at')
      .eq('interaction_type', 'config')
      .eq('status', 'active')
      .is('deleted_at', null);
    
    if (agentsError) throw agentsError;
    
    console.log(`Retrieved ${agentsData?.length || 0} agents for client metrics`);
    
    // Get unique client IDs to count total active clients
    const uniqueClientIds = new Set();
    const activeClientIds = new Set();
    
    for (const agent of agentsData) {
      if (agent.client_id) {
        uniqueClientIds.add(agent.client_id);
        
        // Count as active if has activity in last 48 hours
        if (agent.last_active && new Date(agent.last_active) > timeAgo) {
          activeClientIds.add(agent.client_id);
        }
      }
    }
    
    const totalClients = uniqueClientIds.size;
    const activeClients = activeClientIds.size;
    
    // Calculate client growth rate from active/total ratio
    const clientGrowthRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;
    
    console.log(`Client metrics: total=${totalClients}, active=${activeClients}, growth=${clientGrowthRate}%`);
    
    return {
      total: totalClients,
      active: activeClients,
      changePercentage: clientGrowthRate,
      chartData: generateChartData()
    };
  } catch (error) {
    console.error('Error fetching client metrics:', error);
    throw error;
  }
};

/**
 * Fetches agent-related metrics for the admin dashboard
 * @returns Agent metrics including total, active and change percentage
 */
export const fetchAgentMetrics = async () => {
  try {
    // Get information about agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('interaction_type', 'config')
      .eq('status', 'active')
      .is('deleted_at', null);
    
    if (agentsError) throw agentsError;
    
    const totalAgents = agents.length;
    
    // Time threshold for "active" agents (48 hours ago)
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - 48);
    
    // Active agents: agents with activity in last 48 hours
    const activeAgents = agents.filter(agent => 
      agent.last_active && new Date(agent.last_active) > timeAgo
    ).length;
    
    // Get the growth rate for agents based on active/total ratio
    const agentGrowthRate = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;
    
    return {
      total: totalAgents,
      active: activeAgents,
      changePercentage: agentGrowthRate,
      chartData: generateChartData()
    };
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    throw error;
  }
};

/**
 * Fetches interaction-related metrics for the admin dashboard
 * @returns Interaction metrics including total and change percentage
 */
export const fetchInteractionMetrics = async () => {
  try {
    // Interactions: Count all chat interactions
    const { count: interactionsCount, error: interactionsError } = await supabase
      .from('ai_agents')
      .select('id', { count: 'exact', head: true })
      .eq('interaction_type', 'chat_interaction');
    
    if (interactionsError) throw interactionsError;
    
    return {
      total: interactionsCount || 0,
      changePercentage: 12, // Mock data for now
      chartData: generateChartData()
    };
  } catch (error) {
    console.error('Error fetching interaction metrics:', error);
    throw error;
  }
};

/**
 * Fetches training-related metrics for the admin dashboard
 * @returns Training metrics including total and change percentage
 */
export const fetchTrainingMetrics = async () => {
  try {
    // Trainings: Combine count of website URLs and document links
    const { count: websiteUrlsCount, error: websiteUrlsError } = await supabase
      .from('website_urls')
      .select('id', { count: 'exact', head: true });
    
    if (websiteUrlsError) throw websiteUrlsError;
    
    const { count: documentLinksCount, error: documentLinksError } = await supabase
      .from('document_links')
      .select('id', { count: 'exact', head: true });
    
    if (documentLinksError) throw documentLinksError;
    
    const { count: driveLinksCount, error: driveLinksError } = await supabase
      .from('google_drive_links')
      .select('id', { count: 'exact', head: true });
    
    if (driveLinksError) throw driveLinksError;
    
    const trainingsTotal = (websiteUrlsCount || 0) + (documentLinksCount || 0) + (driveLinksCount || 0);
    
    return {
      total: trainingsTotal,
      changePercentage: 15, // Mock data for now
      chartData: generateChartData()
    };
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    throw error;
  }
};

/**
 * Fetches administration-related metrics for the admin dashboard
 * @returns Administration metrics including total and change percentage
 */
export const fetchAdministrationMetrics = async () => {
  try {
    // Administration: Count administration-related activities using activities table
    const { count: adminActivitiesCount, error: adminActivitiesError } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .in('type', ['client_created', 'client_updated', 'client_deleted']);
    
    if (adminActivitiesError) throw adminActivitiesError;
    
    return {
      total: adminActivitiesCount || 0,
      changePercentage: 3, // Mock data for now
      chartData: generateChartData()
    };
  } catch (error) {
    console.error('Error fetching administration metrics:', error);
    throw error;
  }
};

/**
 * Fetches activity charts data from RPC function
 * @returns Activity charts data including database, auth, storage, and realtime metrics
 */
export const fetchActivityChartsData = async () => {
  try {
    console.log('Fetching activity charts data...');
    // Get activity charts data from RPC function
    const { data: chartData, error: chartError } = await supabase.rpc('get_dashboard_activity_charts');
    
    if (chartError) {
      console.error('RPC error:', chartError);
      throw chartError;
    }
    
    console.log('Activity charts data received:', chartData ? 'success' : 'empty');
    
    const parsedChartData = typeof chartData === 'string' ? JSON.parse(chartData) : chartData;
    
    return parsedChartData;
  } catch (error) {
    console.error('Error fetching activity charts data:', error);
    throw error;
  }
};

/**
 * Fetches all dashboard data in a single function
 * @returns All dashboard data needed for the admin dashboard
 */
export const fetchAllDashboardData = async () => {
  try {
    console.log('Fetching all dashboard data...');
    const [
      clientMetrics,
      agentMetrics,
      interactionMetrics,
      trainingMetrics,
      administrationMetrics,
      activityCharts
    ] = await Promise.all([
      fetchClientMetrics(),
      fetchAgentMetrics(),
      fetchInteractionMetrics(),
      fetchTrainingMetrics(),
      fetchAdministrationMetrics(),
      fetchActivityChartsData()
    ]);
    
    console.log('All dashboard data fetched successfully');
    
    return {
      clients: clientMetrics,
      agents: agentMetrics,
      interactions: interactionMetrics,
      trainings: trainingMetrics,
      administration: administrationMetrics,
      activityCharts
    };
  } catch (error) {
    console.error('Error fetching all dashboard data:', error);
    throw error;
  }
};
