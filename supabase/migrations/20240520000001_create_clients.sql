-- Create clients table
create table if not exists clients (
    id uuid primary key default gen_random_uuid(),
    client_id uuid unique default gen_random_uuid(),
    name text not null,
    email text,
    status text default 'active' check (status in ('active', 'inactive', 'deleted')),
    company text,
    description text,
    logo_url text,
    logo_storage_path text,
    settings jsonb default '{}'::jsonb,
    user_id uuid references auth.users(id),
    deletion_scheduled_at timestamptz,
    deleted_at timestamptz,
    last_active timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_clients_user_id on clients(user_id);
create index if not exists idx_clients_status on clients(status);
create index if not exists idx_clients_name on clients(name);
create index if not exists idx_clients_email on clients(email);

-- Add trigger for updated_at
create trigger set_clients_updated_at
    before update on clients
    for each row
    execute function update_updated_at_column();

-- Enable RLS
alter table clients enable row level security;

-- Create RLS policies
create policy "Users can view their own clients"
    on clients for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can create their own clients"
    on clients for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update their own clients"
    on clients for update
    to authenticated
    using (user_id = auth.uid());

create policy "Users can delete their own clients"
    on clients for delete
    to authenticated
    using (user_id = auth.uid()); 