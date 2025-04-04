-- Create document_content table
create table if not exists document_content (
  id bigint primary key generated always as identity,
  client_id uuid not null,
  document_id uuid not null unique,
  content text,
  metadata jsonb default '{}'::jsonb,
  filename text,
  file_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create assistant_documents table
create table if not exists assistant_documents (
  id bigint primary key generated always as identity,
  document_id uuid not null references document_content(document_id),
  status text default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_document_content_client_id on document_content(client_id);
create index if not exists idx_document_content_document_id on document_content(document_id);
create index if not exists idx_assistant_documents_document_id on assistant_documents(document_id);
create index if not exists idx_assistant_documents_status on assistant_documents(status);

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('client_documents', 'client_documents', false)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create storage policies
do $$ 
begin
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow users to view their own documents') then
        create policy "Allow users to view their own documents"
        on storage.objects for select
        to authenticated
        using (
            bucket_id = 'client_documents'
            and (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow users to upload their own documents') then
        create policy "Allow users to upload their own documents"
        on storage.objects for insert
        to authenticated
        with check (
            bucket_id = 'client_documents'
            and (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow users to update their own documents') then
        create policy "Allow users to update their own documents"
        on storage.objects for update
        to authenticated
        using (
            bucket_id = 'client_documents'
            and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
            bucket_id = 'client_documents'
            and (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Allow users to delete their own documents') then
        create policy "Allow users to delete their own documents"
        on storage.objects for delete
        to authenticated
        using (
            bucket_id = 'client_documents'
            and (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;
end $$;

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger set_updated_at
  before update on document_content
  for each row
  execute function update_updated_at_column();

create trigger set_updated_at
  before update on assistant_documents
  for each row
  execute function update_updated_at_column(); 