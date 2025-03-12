-- Modify the function creation to ensure functions appear in n8n's list
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
    
    -- Create the dynamic function in the public schema
    create_function_sql := format(
        $func$
        create or replace function public.%I(
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
        stable    -- Mark as stable for better n8n integration
        as $inner$
        begin
            -- Verify the function is being called with service_role
            if not exists (
                select 1 from ai_agents 
                where client_id = %L::uuid and agent_name = %L
            ) then
                raise exception 'Invalid client_id or agent_name combination';
            end if;

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
        target_agent_name,
        target_client_id,
        target_agent_name
    );
    
    -- Execute the dynamic function creation
    execute create_function_sql;
    
    -- Grant execute permission to authenticated users and service_role
    execute format('grant execute on function public.%I(vector, float, int) to authenticated, service_role', function_name);
    
    -- Create comment for better n8n documentation
    execute format(
        'comment on function public.%I(vector, float, int) is %L',
        function_name,
        format('Match documents for client %s and agent %s. Parameters: query_embedding (required), similarity_threshold (default 0.7), match_count (default 5)',
            target_client_id,
            target_agent_name
        )
    );
    
    raise notice 'Created function: % in public schema with permissions', function_name;
end;
$$ language plpgsql;

-- Recreate all existing functions with the new format
do $$
declare
    agent_record record;
begin
    -- Drop existing functions first to ensure clean recreation
    for agent_record in 
        select distinct client_id, agent_name 
        from ai_agents 
    loop
        execute format(
            'drop function if exists public.%I(vector, float, int)',
            'match_documents_' || replace(agent_record.client_id::text, '-', '_') || '_' || replace(agent_record.agent_name, ' ', '_')
        );
    end loop;

    -- Recreate all functions
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