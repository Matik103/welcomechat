-- Function to create a specific match_documents function for a client/agent pair
create or replace function create_match_documents_function(
    target_client_id uuid,
    target_agent_name text
) returns void as $$
declare
    function_name text;
    create_function_sql text;
begin
    -- Generate the function name: match_documents_clientID_agentName
    function_name := 'match_documents_' || replace(target_client_id::text, '-', '_') || '_' || replace(target_agent_name, ' ', '_');
    
    -- Create the dynamic function
    create_function_sql := format(
        $func$
        create or replace function %I(
            query_embedding vector(1536),
            similarity_threshold float default 0.7,
            match_count int default 5
        ) returns table (
            id uuid,
            content text,
            metadata jsonb,
            similarity float
        )
        language plpgsql
        security definer
        as $inner$
        begin
            return query
            select
                id,
                content,
                metadata,
                1 - (ai_agents.embedding <=> query_embedding) as similarity
            from ai_agents
            where 
                client_id = %L::uuid
                and agent_name = %L
                and content is not null 
                and embedding is not null
                and 1 - (ai_agents.embedding <=> query_embedding) > similarity_threshold
            order by ai_agents.embedding <=> query_embedding
            limit match_count;
        end;
        $inner$;
        $func$,
        function_name,
        target_client_id,
        target_agent_name
    );
    
    -- Execute the dynamic function creation
    execute create_function_sql;
    
    -- Log the creation (optional)
    raise notice 'Created function: %', function_name;
end;
$$ language plpgsql;

-- Function to automatically create match_documents function when a new agent is created
create or replace function auto_create_match_documents_function()
returns trigger as $$
begin
    -- Create the specific match_documents function for this agent
    perform create_match_documents_function(new.client_id, new.agent_name);
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically create match_documents function for new agents
create trigger create_match_documents_on_agent_creation
    after insert on ai_agents
    for each row
    execute function auto_create_match_documents_function();

-- Function to get the specific match_documents function name for a client/agent
create or replace function get_match_documents_function_name(
    target_client_id uuid,
    target_agent_name text
) returns text as $$
begin
    return 'match_documents_' || replace(target_client_id::text, '-', '_') || '_' || replace(target_agent_name, ' ', '_');
end;
$$ language plpgsql; 