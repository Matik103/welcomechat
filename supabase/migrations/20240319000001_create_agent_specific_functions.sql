-- Function to match documents for a specific client/agent combination
create or replace function match_documents_for_agent(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  target_client_id uuid,
  target_agent_name text
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
as $$
begin
  -- Validate the client_id and agent_name exist
  if not exists (
    select 1 from ai_agents 
    where client_id = target_client_id 
    and agent_name = target_agent_name
    limit 1
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
    client_id = target_client_id
    and agent_name = target_agent_name
    and content is not null 
    and embedding is not null
    and 1 - (ai_agents.embedding <=> query_embedding) > similarity_threshold
  order by ai_agents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Function to insert vector data for a specific client/agent combination
create or replace function insert_agent_vector_data(
  target_client_id uuid,
  target_agent_name text,
  vector_content text,
  vector_embedding vector(1536),
  vector_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  inserted_id uuid;
begin
  -- Validate the client_id and agent_name exist
  if not exists (
    select 1 from ai_agents 
    where client_id = target_client_id 
    and agent_name = target_agent_name
    limit 1
  ) then
    raise exception 'Invalid client_id or agent_name combination';
  end if;

  -- Insert the vector data
  insert into ai_agents (
    client_id,
    agent_name,
    content,
    embedding,
    metadata
  ) values (
    target_client_id,
    target_agent_name,
    vector_content,
    vector_embedding,
    vector_metadata
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

-- Create helper function to get agent details (useful for n8n setup)
create or replace function get_agent_details(
  target_client_id uuid,
  target_agent_name text
)
returns table (
  client_id uuid,
  agent_name text,
  created_at timestamptz
)
language sql
security definer
as $$
  select distinct
    client_id,
    agent_name,
    min(created_at) as created_at
  from ai_agents
  where 
    client_id = target_client_id
    and agent_name = target_agent_name
  group by client_id, agent_name;
$$;

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