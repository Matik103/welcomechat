-- Function to list all available agent match functions
create or replace function list_agent_match_functions()
returns table (
    client_id uuid,
    agent_name text,
    function_name text,
    example_usage jsonb
) language plpgsql
security definer
as $$
begin
    return query
    select distinct
        a.client_id,
        a.agent_name,
        get_match_documents_function_name(a.client_id, a.agent_name) as function_name,
        jsonb_build_object(
            'function_name', get_match_documents_function_name(a.client_id, a.agent_name),
            'parameters', jsonb_build_object(
                'query_embedding', 'your_embedding_array_here',
                'similarity_threshold', 0.7,
                'match_count', 5
            )
        ) as example_usage
    from ai_agents a
    where exists (
        select 1 from pg_proc
        where proname = get_match_documents_function_name(a.client_id, a.agent_name)::text
    )
    order by a.agent_name;
end;
$$;

-- Function to get agent function details by client_id and agent_name
create or replace function get_agent_function_details(
    target_client_id uuid,
    target_agent_name text
) returns jsonb
language plpgsql
security definer
as $$
declare
    result jsonb;
begin
    select jsonb_build_object(
        'function_name', get_match_documents_function_name(target_client_id, target_agent_name),
        'client_id', target_client_id,
        'agent_name', target_agent_name,
        'parameters', jsonb_build_object(
            'query_embedding', 'your_embedding_array_here',
            'similarity_threshold', 0.7,
            'match_count', 5
        )
    ) into result;
    
    return result;
end;
$$;

-- Create a view for n8n to easily list available agents and their functions
create or replace view available_agent_functions as
select 
    a.client_id,
    a.agent_name,
    get_match_documents_function_name(a.client_id, a.agent_name) as function_name,
    c.name as client_name,  -- Assuming clients table has a name column
    a.created_at,
    a.updated_at
from ai_agents a
join clients c on c.id = a.client_id
where exists (
    select 1 from pg_proc
    where proname = get_match_documents_function_name(a.client_id, a.agent_name)::text
); 