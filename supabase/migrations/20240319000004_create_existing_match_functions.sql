-- Create match_documents functions for all existing agents
do $$
declare
    agent_record record;
begin
    for agent_record in 
        select distinct client_id, agent_name 
        from ai_agents 
    loop
        perform create_match_documents_function(
            agent_record.client_id,
            agent_record.agent_name
        );
    end loop;
end;
$$ language plpgsql; 