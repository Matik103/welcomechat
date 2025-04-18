-- Drop existing policies if they exist
do $$ 
begin
    execute format('drop policy if exists %I on storage.objects', 'Allow users to view their own documents');
    execute format('drop policy if exists %I on storage.objects', 'Allow users to upload their own documents');
    execute format('drop policy if exists %I on storage.objects', 'Allow users to update their own documents');
    execute format('drop policy if exists %I on storage.objects', 'Allow users to delete their own documents');
    execute format('drop policy if exists %I on storage.objects', 'Allow authenticated users to upload documents');
exception when others then
    raise notice 'Error dropping policies: %', sqlerrm;
end $$;

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('client_documents', 'client_documents', false)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policies
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