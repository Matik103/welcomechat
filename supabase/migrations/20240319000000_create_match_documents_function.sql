-- Create a function that performs similarity search with proper filtering
create or replace function match_documents(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  client_id_filter uuid,
  agent_name_filter text
)
returns table (
  id uuid,
  client_id uuid,
  agent_name text,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
stable
as $$
begin
  return query
  select
    id,
    client_id::uuid,
    agent_name,
    content,
    metadata,
    1 - (ai_agents.embedding <=> query_embedding) as similarity
  from ai_agents
  where 
    -- Ensure we only match vector data rows (content and embedding are not null)
    content is not null 
    and embedding is not null
    -- Filter by client_id and agent_name
    and client_id = client_id_filter
    and agent_name = agent_name_filter
    -- Apply similarity threshold
    and 1 - (ai_agents.embedding <=> query_embedding) > similarity_threshold
  order by ai_agents.embedding <=> query_embedding
  limit match_count;
end;
$$; 