
-- Verify and report on agent name consistency

-- Get stats on agent names
SELECT 
  COUNT(*) AS total_agents,
  COUNT(DISTINCT client_id) AS unique_clients,
  COUNT(*) FILTER (WHERE name = 'ai_agent') AS generic_name_count,
  COUNT(*) FILTER (WHERE name LIKE '% Assistant') AS assistant_suffix_count
FROM ai_agents;

-- Check for any remaining mismatches between client agent_name and ai_agents name
SELECT 
  c.id as client_id,
  c.client_name,
  c.agent_name as client_agent_name,
  a.name as ai_agent_name,
  COUNT(a.id) as record_count
FROM
  clients c
JOIN
  ai_agents a ON c.id = a.client_id
WHERE
  c.agent_name IS NOT NULL
  AND a.name != c.agent_name
GROUP BY
  c.id, c.client_name, c.agent_name, a.name
ORDER BY
  record_count DESC;

-- Log the verification
INSERT INTO client_activities (
  client_id,
  activity_type,
  description,
  metadata
)
SELECT 
  id,
  'system_update',
  'Verified AI agent naming consistency',
  jsonb_build_object(
    'verification_date', NOW(),
    'agent_name', agent_name
  )
FROM clients 
WHERE id = (SELECT MIN(id) FROM clients)
LIMIT 1;

-- Return a success message
SELECT 'Agent name verification completed successfully' AS result;
