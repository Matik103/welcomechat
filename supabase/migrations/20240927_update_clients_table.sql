-- Update clients table to remove agent_name requirement
ALTER TABLE public.clients
ALTER COLUMN agent_name DROP NOT NULL,
ALTER COLUMN agent_name SET DEFAULT NULL; 