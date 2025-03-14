-- Create client_temp_passwords table
create table if not exists client_temp_passwords (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  temp_password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  used boolean default false not null
);

-- Create index on email for faster lookups
create index if not exists client_temp_passwords_email_idx on client_temp_passwords(email);

-- Add RLS policies
alter table client_temp_passwords enable row level security;

-- Only allow service role to access this table
create policy "Service role can manage temp passwords"
  on client_temp_passwords
  for all
  using (auth.jwt() ->> 'role' = 'service_role'); 