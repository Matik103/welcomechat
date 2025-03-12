-- Enable the pgvector extension if not enabled
create extension if not exists vector;

-- Create the ai_agents table if it doesn't exist
create table if not exists ai_agents (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references clients(id) on delete cascade,
    agent_name text not null,
    content text,
    embedding vector(1536),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    -- Ensure each client can only have one base agent record
    constraint unique_client_agent unique (client_id, agent_name)
);

-- Create index for faster lookups
create index if not exists idx_ai_agents_client_agent 
on ai_agents(client_id, agent_name);

-- Create index for vector similarity search
create index if not exists idx_ai_agents_embedding 
on ai_agents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Enable RLS
alter table ai_agents enable row level security;

-- Policy for n8n service role to insert vector data
create policy "Enable insert for service role"
on ai_agents for insert
to service_role
with check (true);

-- Policy for n8n service role to read vector data
create policy "Enable read for service role"
on ai_agents for select
to service_role
using (true);

-- Policy for n8n service role to update vector data
create policy "Enable update for service role"
on ai_agents for update
to service_role
using (true)
with check (true);

-- Create trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_ai_agents_updated_at
    before update on ai_agents
    for each row
    execute function update_updated_at_column(); 